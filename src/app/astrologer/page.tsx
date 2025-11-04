"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import moment from "moment";
import { CSVLink } from "react-csv";
import Swal from "sweetalert2";
import DataTable, { TableColumn } from "react-data-table-component";
import {
  Button,
  Dialog,
  DialogContent,
  FormControl,
  Grid,
  InputLabel,
  TextField,
  Typography,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { DeepSearchSpace } from "@/utils/common-function";

import { Color } from "@/assets/colors";
import MainDatatable from "@/components/common/MainDatatable";
import { api_url, base_url, get_astrologer } from "@/lib/api-routes";
import DatatableHeading from "@/components/datatable/DatatableHeading";
import {
  SwitchOnSvg,
  SwitchOffSvg,
  ViewSvg,
  EditSvg,
  WalletSvg,
  CrossSvg,
} from "@/components/svgs/page";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface Astrologer {
  _id: string;
  astrologerName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  isVerified: boolean;
  chat_status?: "online" | "offline";
  call_status?: "online" | "offline";
  video_call_status?: "online" | "offline";
}

type AstrologerColumn = TableColumn<Astrologer>;

// CSV Row Type
interface CSVRow {
  [key: string]: string | number | boolean | undefined;
}

export default function AstrologerPage() {
  const router = useRouter();

  // State
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const filteredData = DeepSearchSpace(astrologers, searchText);

  // Wallet Modal
  const [walletModal, setWalletModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [inputFieldDetail, setInputFieldDetail] = useState<{
    amount: string;
    type: "credit" | "deduct" | "";
  }>({ amount: "", type: "" });
  const [inputFieldError, setInputFieldError] = useState<{
    amount?: string;
    type?: string;
  }>({});

  // Edit Status Modal
  const [editState, setEditState] = useState<{
    open: boolean;
    astro: Astrologer | null;
  }>({ open: false, astro: null });

  // -----------------------------------------------------------------
  // Data Fetching
  // -----------------------------------------------------------------
  const fetchAstrologers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${base_url}${get_astrologer}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const sorted = (data.astrologers || []).sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAstrologers(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAstrologers();
  }, []);

  // -----------------------------------------------------------------
  // CSV Data (Transformed for Export)
  // -----------------------------------------------------------------
  const csvData: CSVRow[] = useMemo(() => {
    return filteredData.map((astro, index) => ({
      "S.No.": index + 1,
      Name: astro.astrologerName,
      Email: astro.email,
      Mobile: astro.phoneNumber,
      "Created Date": moment(astro.createdAt).format("Do MMM YYYY"),
      Status: astro.isVerified ? "Verified" : "Unverified",
    }));
  }, [filteredData]);

  // -----------------------------------------------------------------
  // Wallet Handlers
  // -----------------------------------------------------------------
  const openWallet = (astro: Astrologer) => {
    setUserId(astro._id);
    setWalletModal(true);
  };

  const closeWallet = () => {
    setWalletModal(false);
    setInputFieldDetail({ amount: "", type: "" });
    setInputFieldError({});
  };

  const handleInputFieldError = (
    field: "amount" | "type",
    msg: string | null
  ) => {
    setInputFieldError((prev) => ({ ...prev, [field]: msg ?? undefined }));
  };

  const handleInputField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInputFieldDetail((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<"credit" | "deduct">) => {
    const { name, value } = e.target;
    if (name === "type") {
      setInputFieldDetail((prev) => ({
        ...prev,
        type: value as "credit" | "deduct",
      }));
    }
  };

  const validateWallet = () => {
    let ok = true;
    const { amount, type } = inputFieldDetail;

    if (!amount) {
      handleInputFieldError("amount", "Please Enter Amount");
      ok = false;
    } else if (Number(amount) <= 0) {
      handleInputFieldError("amount", "Please Enter Amount Greater Than Zero");
      ok = false;
    } else {
      handleInputFieldError("amount", null);
    }

    if (!type) {
      handleInputFieldError("type", "Please Select Type");
      ok = false;
    } else {
      handleInputFieldError("type", null);
    }
    return ok;
  };

  const submitWallet = async () => {
    if (!validateWallet()) return;

    const payload = {
      transactions: [
        { astrologerId: userId, amount: Number(inputFieldDetail.amount) },
      ],
      type: inputFieldDetail.type,
    };

    try {
      const res = await fetch("/api/astrologers/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchAstrologers();
      closeWallet();
    } catch (e) {
      console.error(e);
    }
  };

 
const toggleVerify = async (astro: Astrologer) => {
  const result = await Swal.fire({
    title: 'Change Verification Status?',
    text: `Are you sure you want to ${astro.isVerified ? 'unverify' : 'verify'} ${astro.astrologerName}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, change it!',
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

  try {
    // Show loading
    Swal.fire({
      title: 'Updating...',
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/verify-astrologer-profile`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          astrologerId: astro._id,
          isVerified: !astro.isVerified,
        }),
      }
    );
    
    await fetchAstrologers();
    
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: `Astrologer ${!astro.isVerified ? 'verified' : 'unverified'} successfully`,
      timer: 2000,
      showConfirmButton: false
    });
  } catch (e) {
    console.error(e);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to update verification status'
    });
  }
};

const openEdit = (astro: Astrologer) => setEditState({ open: true, astro });
  const closeEdit = () => setEditState({ open: false, astro: null });

// -----------------------------------------------------------------
// Change Status with Swal
// -----------------------------------------------------------------
const changeStatus = async (
  field: "chat_status" | "call_status" | "video_call_status",
  id: string,
  current: string | undefined
) => {
  const newVal = current === "online" ? "offline" : "online";
  const fieldName = field.replace('_status', '').replace('_', ' ');
  
  const result = await Swal.fire({
    title: `Change ${fieldName} status?`,
    text: `Set ${fieldName} to ${newVal}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: `Yes, set to ${newVal}`,
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

  try {
    Swal.fire({
      title: 'Updating Status...',
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    await fetch("/api/astrologers/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ astrologerId: id, field, value: newVal }),
    });
    
    await fetchAstrologers();
    closeEdit();
    
    Swal.fire({
      icon: 'success',
      title: 'Status Updated!',
      text: `${fieldName} set to ${newVal}`,
      timer: 2000,
      showConfirmButton: false
    });
  } catch (e) {
    console.error(e);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to update status'
    });
  }
};

  // -----------------------------------------------------------------
  // Edit Status Modal
  // -----------------------------------------------------------------
  
  

  // -----------------------------------------------------------------
  // Table Columns
  // -----------------------------------------------------------------
  const columns=useMemo(
    () => [
      {
        name: "S.No.",
        selector: (_row:any, index?:number) => (index !== undefined ? index + 1 : 0),
        width: "80px",
      },
      { name: "Name", selector: (row:any) => row.astrologerName },
      { name: "Email", selector: (row:any) => row.email, width: "250px" },
      { name: "Mobile", selector: (row:any) => row.phoneNumber },
      {
        name: "Created Date",
        selector: (row:any) => moment(row.createdAt).format("Do MMM YYYY"),
        width: "140px",
      },
      {
        name: "Status",
        cell: (row:any) => (
          <div style={{ cursor: "pointer" }} onClick={() => toggleVerify(row)}>
            {row.isVerified ? <SwitchOnSvg /> : <SwitchOffSvg />}
          </div>
        ),
        width: "140px",
        center: true,
      },
      {
        name: "Action",
        cell: (row) => (
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <div
              onClick={() => {
                sessionStorage.setItem(
                  "selectedAstrologer",
                  JSON.stringify(row)
                );
                router.push("/astrologer/view-astrologer");
              }}
              style={{ cursor: "pointer" }}
            >
              <ViewSvg />
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click if in a table
                router.push(`/astrologer/edit-astrologer?id=${row._id}`);
              }}
            >
              <EditSvg />
            </div>
            <div style={{ cursor: "pointer" }} onClick={() => openWallet(row)}>
              <WalletSvg />
            </div>
            <MoreVertIcon
              onClick={() => openEdit(row)}
              sx={{ cursor: "pointer" }}
            />
          </div>
        ),
        width: "200px",
        center: true,
      },
    ],
    [router]
  );

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <>
   

        <MainDatatable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          title="List of Astrologers"
          url="/astrologer/add-astrologer"
        />
    

      {/* Wallet Modal */}
      <Dialog
        open={walletModal}
        PaperProps={{
          sx: { maxWidth: { xs: "90vw", sm: "50vw" }, width: "100%" },
        }}
      >
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 500, color: Color.black }}
                >
                  Wallet
                </Typography>
                <div onClick={closeWallet} style={{ cursor: "pointer" }}>
                  <CrossSvg />
                </div>
              </div>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={
                  <>
                    Amount <span style={{ color: "red" }}>*</span>
                  </>
                }
                variant="outlined"
                fullWidth
                name="amount"
                value={inputFieldDetail.amount}
                onChange={handleInputField}
                error={!!inputFieldError.amount}
                helperText={inputFieldError.amount}
                onFocus={() => handleInputFieldError("amount", null)}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth error={!!inputFieldError.type}>
                <InputLabel id="type-label">Type *</InputLabel>
                <Select
                  labelId="type-label"
                  label="Type *"
                  name="type"
                  value={inputFieldDetail.type}
                  onChange={handleSelectChange}
                  onFocus={() => handleInputFieldError("type", null)}
                >
                  <MenuItem value="" disabled>
                    ---Select Type---
                  </MenuItem>
                  <MenuItem value="credit">Add</MenuItem>
                  <MenuItem value="deduct">Deduct</MenuItem>
                </Select>
                {inputFieldError.type && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ ml: 2, mt: 0.5 }}
                  >
                    {inputFieldError.type}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Grid container justifyContent="flex-end">
                <Button
                  onClick={submitWallet}
                  sx={{
                    bgcolor: Color.primary,
                    color: Color.white,
                    px: 3,
                    py: 1,
                    borderRadius: 1,
                    fontWeight: 500,
                    textTransform: "none",
                    "&:hover": { bgcolor: Color.primary },
                  }}
                >
                  Submit
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Edit Status Modal */}
      <Dialog open={editState.open} onClose={closeEdit}>
        <DialogContent sx={{ minWidth: 300, maxWidth: 500 }}>
          {editState.astro && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {editState.astro.astrologerName}
                  </Typography>
                  <Button
                    onClick={closeEdit}
                    sx={{
                      minWidth: 32,
                      bgcolor: "grey.500",
                      color: "white",
                      borderRadius: "50%",
                      p: 0.5,
                      "&:hover": { bgcolor: "grey.600" },
                    }}
                  >
                    ×
                  </Button>
                </div>
              </Grid>

              {(
                ["chat_status", "call_status", "video_call_status"] as const
              ).map((field) => {
                const status = editState.astro![field];
                return (
                  <React.Fragment key={field}>
                    <Grid item xs={5}>
                      {field === "chat_status" && "Change Chat Status"}
                      {field === "call_status" && "Change Call Status"}
                      {field === "video_call_status" &&
                        "Change Video Call Status"}
                    </Grid>
                    <Grid item xs={7}>
                      <Button
                        onClick={() =>
                          changeStatus(field, editState.astro!._id, status)
                        }
                        fullWidth
                        sx={{
                          bgcolor:
                            status === "online" ? "success.main" : "error.main",
                          color: "white",
                          textTransform: "none",
                          fontWeight: 500,
                        }}
                      >
                        {status === "online"
                          ? `Set ${field.replace("_status", "")} Offline`
                          : `Set ${field.replace("_status", "")} Online`}
                      </Button>
                    </Grid>
                  </React.Fragment>
                );
              })}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
