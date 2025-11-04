//src/components/layout/header.tsx
"use client";

import React, { useEffect, useState } from "react";
import { FaBars } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import GroupIcon from "@mui/icons-material/Group";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import {
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onToggleSidebar }) => {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Handle menu open/close
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle change password modal
  const handleModalOpen = () => {
    setModalOpen(true);
  };
  
  const handleModalClose = () => {
    setModalOpen(false);
  };

  // Handle logout
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to logout",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "grey",
      confirmButtonText: "Logout",
    });

    if (result.isConfirmed) {
      try {
        setData(null);
        localStorage.clear();
        router.push("/");
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Check user data and redirect if not logged in
// In header.tsx
useEffect(() => {
  if (typeof window === 'undefined') return;
  
  try {
    const userData = localStorage.getItem("userDetails");
    setData(userData);
    // Don't redirect here - let middleware handle it
  } catch (e) {
    console.error(e);
  }
}, []);
  // Handle sidebar toggle on window resize
  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth > 900 && !isSidebarOpen) {
  //       onToggleSidebar();
  //     } else if (window.innerWidth < 900 && isSidebarOpen) {
  //       onToggleSidebar();
  //     }
  //   };

  //   window.addEventListener("resize", handleResize);
  //   handleResize();

  //   return () => {
  //     window.removeEventListener("resize", handleResize);
  //   };
  // }, [isSidebarOpen, onToggleSidebar]);

  return (
    <>
      {/* Header with Tailwind CSS */}
      <header className="bg-white w-full text-gray-500 py-1 px-4 border-b border-gray-300 shadow-sm">
        <div className="h-12 flex justify-between items-center relative">
          <div>
            <div 
              onClick={onToggleSidebar}
              className="flex justify-center items-center bg-[#EF4444] text-white rounded-lg w-8 h-8 cursor-pointer hover:bg-red-800 transition-colors duration-200"
            >
              <FaBars className="text-base" />
            </div>
          </div>

          <div>
            <Button
              id="basic-button"
              aria-controls={open ? "basic-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              onClick={handleClick}
              className="border border-gray-100 flex items-center shadow-sm hover:shadow-md transition-shadow"
              style={{ color: "#EF4444", textTransform: "none" }}
            >
              <GroupIcon className="mr-1 text-lg" />
              Admin
            </Button>

            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{ "aria-labelledby": "basic-button" }}
              className="mt-1"
              PaperProps={{
                className: "shadow-lg rounded-lg"
              }}
            >
              <div className="flex flex-col gap-1 p-1">
                {/* Uncomment if change password functionality is needed */}
                {/* <MenuItem 
                  onClick={handleModalOpen} 
                  className="text-sm hover:bg-gray-100 rounded-md transition-colors"
                >
                  Change Password
                </MenuItem> */}

                <div 
                  onClick={handleLogout}
                  className="flex justify-center items-center bg-red-700 text-white rounded cursor-pointer hover:bg-red-800 transition-colors duration-200"
                >
                  <MenuItem className="flex items-center text-white text-sm py-1">
                    <VpnKeyIcon className="h-4 w-4 mr-2" />
                    Logout
                  </MenuItem>
                </div>
              </div>
            </Menu>
          </div>
        </div>
      </header>

      {/* Change Password Dialog */}
      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="sm" fullWidth>
        <DialogContent className="p-6">
          <Grid container spacing={3}>
            <Grid item xs={12} className="flex justify-between items-center">
              <div className="text-xl font-medium text-gray-800">Change Password</div>
              <div
                className="bg-red-700 text-white px-3 py-1 rounded cursor-pointer hover:bg-red-800 transition-colors duration-200 text-sm font-medium"
                onClick={handleModalClose}
              >
                Close
              </div>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Username"
                variant="outlined"
                fullWidth
                type="text"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="mb-4"
              />
            </Grid>

            <Grid item xs={12} className="relative">
              <TextField
                label="Password"
                variant="outlined"
                fullWidth
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <div
                className="bg-red-700 text-white py-3 px-4 rounded text-center text-lg font-medium cursor-pointer hover:bg-red-800 transition-colors duration-200 shadow-md hover:shadow-lg"
                onClick={() => {
                  // Add password change logic here
                  handleModalClose();
                }}
              >
                Submit
              </div>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;