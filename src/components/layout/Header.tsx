'use client';

import React, { useEffect, useState } from "react";
import { FaBars, FaUser, FaKey } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
}

export default function Header({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
  const router = useRouter();
  const [data, setData] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Logout Function - localStorage + cookie dono clear
  const handleLogout = async () => {
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
        // 1. Backend API call - cookie delete hogi
        await fetch('/api/logout', {
          method: 'POST',
        });

        // 2. localStorage clear karo
        setData("");
        localStorage.clear();

        // 3. Success message
        await Swal.fire({
          icon: 'success',
          title: 'Logged out successfully',
          showConfirmButton: false,
          timer: 1500,
        });

        // 4. Login page par redirect
        router.push('/login');
        router.refresh();
      } catch (e) {
        console.log(e);
        // Agar API fail ho to bhi logout kar do
        localStorage.clear();
        router.push('/login');
      }
    }
  };

  // Check if user is logged in
  useEffect(() => {
    try {
      const userData = localStorage.getItem("userDetails");
      if (userData) {
        setData(userData);
      }
    } catch (e) {
      console.log(e);
    }
  }, []);

  // Handle sidebar resize
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
            <span className="lowercase">Admin</span>
          </button>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white transition duration-200 flex items-center justify-center gap-2"
              >
                <FaKey className="text-sm" />
                Logout
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
  );
}