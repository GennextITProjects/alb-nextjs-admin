'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    Swal.fire({
      icon: 'success',
      title: 'Payment Successful!',
      text: 'Your consultation has been booked. Redirecting...',
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      router.push('/my-booking');
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#980d0d] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your bookings...</p>
      </div>
    </div>
  );
}