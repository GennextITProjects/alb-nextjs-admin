'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { CSVLink } from 'react-csv';
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
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DeepSearchSpace } from '@/utils/common-function';

import { Color } from '@/assets/colors';
import MainDatatable from '@/components/common/MainDatatable';
import { api_url, base_url, get_enquiry_astrologer } from '@/lib/api-routes';
import { EditSvg, CrossSvg } from "@/components/svgs/page";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface Astrologer {
  _id: string;
  astrologerName: string;
  email: string;
  phoneNumber: string;
  state?: string;
  experience: string;
  dateOfBirth: string;
  createdAt: string;
  isVerified?: boolean;
}

// ---------------------------------------------------------------------
// Datatable Heading Component
// ---------------------------------------------------------------------
interface DatatableHeadingProps {
  title: string;
  data: Astrologer[];
}

const DatatableHeading: React.FC<DatatableHeadingProps> = ({ title, data = [] }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '20px',
        backgroundColor: '#fff',
      }}
    >
      <div style={{ fontSize: '22px', fontWeight: 500, color: Color.black }}>
        {title}
      </div>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
        {data.length > 0 && (
          <CSVLink
            filename={`${title}.csv`}
            data={data}
            style={{
              color: '#000',
              fontSize: '1rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 500, color: '#667284' }}>
              <DownloadIcon />
            </div>
          </CSVLink>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------
// Main Client Component
// ---------------------------------------------------------------------
const AstrologerEnquiryClient = () => {
  const router = useRouter();

  // State
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const filteredData = DeepSearchSpace(astrologers, searchText);

  // Wallet Modal
  const [walletModal, setWalletModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [inputFieldDetail, setInputFieldDetail] = useState<{
    amount: string;
    type: 'credit' | 'deduct' | '';
  }>({ amount: '', type: '' });
  const [inputFieldError, setInputFieldError] = useState<{
    amount?: string;
    type?: string;
  }>({});

  // Fetch Astrologers Data
  const fetchAstrologers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${base_url}${get_enquiry_astrologer}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data.astrologerInquiry)) {
        setAstrologers(data.astrologerInquiry);
      } else {
        console.error('Unexpected data format:', data);
        setAstrologers([]);
      }
    } catch (error) {
      console.error('Error fetching astrologers:', error);
      setAstrologers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAstrologers();
  }, []);

  // Verify Toggle
  const toggleVerify = async (astro: Astrologer) => {
    try {
      const response = await fetch('/api/astrologers/enquiry-verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astrologerId: astro._id,
          isVerified: !(astro.isVerified ?? false),
        }),
      });

      if (response.ok) {
        setAstrologers(prev =>
          prev.map(a => 
            a._id === astro._id 
              ? { ...a, isVerified: !(a.isVerified ?? false) } 
              : a
          )
        );
      } else {
        console.error('Failed to update verification status');
      }
    } catch (error) {
      console.error('Error updating verification:', error);
    }
  };

  // Wallet Handlers
  const openWallet = (astro: Astrologer) => {
    setUserId(astro._id);
    setWalletModal(true);
  };

  const closeWallet = () => {
    setWalletModal(false);
    setInputFieldDetail({ amount: '', type: '' });
    setInputFieldError({});
  };

  const handleInputFieldError = (field: 'amount' | 'type', msg: string | null) => {
    setInputFieldError((prev) => ({ ...prev, [field]: msg ?? undefined }));
  };

  const handleInputField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInputFieldDetail((prev) => ({ ...prev, [name]: value }));
  };

  const validateWallet = () => {
    let ok = true;
    const { amount, type } = inputFieldDetail;

    if (!amount) {
      handleInputFieldError('amount', 'Please Enter Amount');
      ok = false;
    } else if (Number(amount) <= 0) {
      handleInputFieldError('amount', 'Amount must be > 0');
      ok = false;
    } else {
      handleInputFieldError('amount', null);
    }

    if (!type) {
      handleInputFieldError('type', 'Please Select Type');
      ok = false;
    } else {
      handleInputFieldError('type', null);
    }
    return ok;
  };

  const submitWallet = async () => {
    if (!validateWallet()) return;

    const payload = {
      transactions: [{ astrologerId: userId, amount: Number(inputFieldDetail.amount) }],
      type: inputFieldDetail.type,
    };

    try {
      const res = await fetch('/api/astrologers/enquiry-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        closeWallet();
        // Optionally refresh the data or show success message
        fetchAstrologers(); // Refresh to show updated wallet balance
      } else {
        throw new Error('Failed to update wallet');
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
      // You might want to show an error message to the user here
    }
  };

  // -----------------------------------------------------------------
  // Table Columns - Fixed TypeScript issues
  // -----------------------------------------------------------------
  const columns = [
    {
      name: 'S.No.',
      selector: (row: Astrologer, rowIndex?: number) => (rowIndex ?? 0) + 1,
      width: '80px',
    },
    { 
      name: 'Name', 
      selector: (row: Astrologer) => row.astrologerName ,
       width: '150px' 
    },
    { 
      name: 'Email', 
      selector: (row: Astrologer) => row.email, 
      width: '200px' 
    },
    { 
      name: 'Mobile', 
      selector: (row: Astrologer) => row.phoneNumber 
    },
    { 
      name: 'State', 
      selector: (row: Astrologer) => row.state || 'N/A' 
    },
    { 
      name: 'Experience', 
      selector: (row: Astrologer) => row.experience 
    },
    {
      name: 'DOB',
      selector: (row: Astrologer) => moment(row.dateOfBirth).format('Do MMM YYYY'),
      width: '120px',
    },
    {
      name: 'Created Date',
      selector: (row: Astrologer) => moment(row.createdAt).format('Do MMM YYYY'),
      width: '140px',
    },
    {
      name: 'Action',
      cell: (row: Astrologer) => (
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div
             onClick={(e) => {
                e.stopPropagation(); // Prevent row click if in a table
                router.push(`/astrologer/edit-astrologer?id=${row._id}`);
              }}
            style={{ cursor: 'pointer' }}
          >
            <EditSvg />
          </div>
        </div>
      ),
      width: '140px',
      center: true,
    },
  ];

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <>
      
        <MainDatatable 
          columns={columns} 
          data={filteredData} 
          title="Astrologer Enquiry"
          url="/astrologer/astrologer-enquiry"
          isLoading={isLoading} 
           addButtonActive={false} 
        />
    

      {/* Wallet Modal */}
      <Dialog
        open={walletModal}
        onClose={closeWallet}
        PaperProps={{
          sx: { 
            maxWidth: { xs: '90vw', sm: '50vw' }, 
            minWidth: { xs: '90vw', sm: '400px' },
            padding: '20px'
          },
        }}
      >
        <DialogContent>
          <Grid container spacing={3} sx={{ alignItems: 'center' }}>
            <Grid item xs={12}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '22px', fontWeight: 500, color: Color.black }}>
                  Wallet
                </div>
                <div onClick={closeWallet} style={{ cursor: 'pointer' }}>
                  <CrossSvg />
                </div>
              </div>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={
                  <>
                    Amount <span style={{ color: 'red' }}>*</span>
                  </>
                }
                variant="outlined"
                fullWidth
                name="amount"
                type="number"
                value={inputFieldDetail.amount}
                onChange={handleInputField}
                error={!!inputFieldError.amount}
                helperText={inputFieldError.amount}
                onFocus={() => handleInputFieldError('amount', null)}
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
                  onChange={handleInputField as any}
                  onFocus={() => handleInputFieldError('type', null)}
                >
                  <MenuItem value="">---Select Type---</MenuItem>
                  <MenuItem value="credit">Add</MenuItem>
                  <MenuItem value="deduct">Deduct</MenuItem>
                </Select>
                {inputFieldError.type && (
                  <Typography color="error" variant="caption">
                    {inputFieldError.type}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Grid container sx={{ justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={closeWallet}
                  sx={{
                    fontWeight: 500,
                    padding: '10px 20px',
                    borderRadius: '5px',
                    fontSize: '15px',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={submitWallet}
                  sx={{
                    fontWeight: 500,
                    backgroundColor: Color.primary,
                    color: Color.white,
                    padding: '10px 20px',
                    borderRadius: '5px',
                    fontSize: '15px',
                    '&:hover': {
                      backgroundColor: Color.primary,
                    },
                  }}
                >
                  Submit
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AstrologerEnquiryClient;