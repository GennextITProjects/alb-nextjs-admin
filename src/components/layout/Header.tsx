'use client';

import React, { useEffect, useState } from "react";
import { FaBars, FaUser, FaKey, FaLock } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
}

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function PasswordModal({ isOpen, onClose }: PasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setErrorMessage("");

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('All fields are required');
      return;
    }

    // Check for spaces in passwords
    if (currentPassword.includes(' ') || newPassword.includes(' ') || confirmPassword.includes(' ')) {
      setErrorMessage('Password cannot contain spaces');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }

    // Check if new password is same as current password
    if (currentPassword === newPassword) {
      setErrorMessage('New password cannot be the same as current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    try {
      const username = localStorage.getItem("userDetails");

      if (!username) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'User session expired. Please login again.',
        });
        return;
      }

      const response = await fetch(`/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Reset form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrorMessage("");
        
        onClose();
        
        await Swal.fire({
          icon: 'success',
          title: 'Password Changed Successfully',
          text: 'Your password has been updated',
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        setErrorMessage(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    onClose();
  };

  const EyeIcon = ({ isVisible }: { isVisible: boolean }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth="1.5" 
      stroke="currentColor" 
      className="w-5 h-5"
    >
      {isVisible ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </>
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      )}
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-800">Change Password</h2>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition duration-200"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <EyeIcon isVisible={showCurrent} />
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <EyeIcon isVisible={showNew} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <EyeIcon isVisible={showConfirm} />
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="text-red-500 text-sm">{errorMessage}</div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white text-lg rounded-lg transition duration-200"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Header({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  const handleLogout = async () => {
    handleClose();

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You want to logout',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: 'grey',
      confirmButtonText: 'Logout',
    });

    if (result.isConfirmed) {
      try {
        // STEP 1: Call logout API to clear cookies FIRST
        const response = await fetch(`/api/admin/logout`, {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store', // Prevent caching
        });

        // STEP 2: Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        setUserName("");

        // STEP 3: Show success message (brief)
        Swal.fire({
          icon: 'success',
          title: 'Logged out successfully',
          showConfirmButton: false,
          timer: 1000,
        });

        // STEP 4: Wait a bit then hard redirect
        setTimeout(() => {
          window.location.replace('/login'); // Use replace instead of href
        }, 1000);
        
      } catch (error) {
        console.error('Logout error:', error);
        
        // Even if API fails, clear everything
        localStorage.clear();
        sessionStorage.clear();
        setUserName("");
        
        // Hard redirect
        window.location.replace('/login');
      }
    }
  };

   useEffect(() => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };

    const usernameCookie = getCookie('username');
    if (usernameCookie) {
      setUserName(usernameCookie);
      // Also update localStorage for backward compatibility
      localStorage.setItem("userDetails", usernameCookie);
    } else {
      // Fallback to localStorage if cookie doesn't exist yet
      const storedUsername = localStorage.getItem("userDetails");
      if (storedUsername) {
        setUserName(storedUsername);
      }
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsSidebarOpen(true);
      } else if (window.innerWidth < 900) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setIsSidebarOpen]);

  return (
    <>
      <header className="bg-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Sidebar Toggle */}
          <div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition duration-200"
            >
              <FaBars className="text-xl" />
            </button>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              id="user-menu-button"
              onClick={handleClick}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-red-500 hover:bg-gray-50 transition duration-200"
            >
              <FaUser className="text-sm" />
              <span className="">{userName ? userName : "admin"}</span>
            </button>

            {/* Dropdown Menu */}
            {open && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                
            

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 transition duration-200 flex items-center gap-3 text-red-600"
                >
                  <FaKey className="text-red-500" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Click outside to close */}
            {open && (
              <div
                className="fixed inset-0 z-40"
                onClick={handleClose}
              />
            )}
          </div>
        </div>
      </header>

      <PasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </>
  );
}