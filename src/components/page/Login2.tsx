// 'use client';

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import OtpInput from 'react-otp-input';
// import PhoneInput from 'react-phone-input-2';
// import 'react-phone-input-2/lib/style.css';
// import {
//   Sheet,
//   SheetContent,
// } from '@/components/ui/sheet';
// import { X, Pencil } from 'lucide-react';
// import { onMessageListener, requestFcmToken } from '@/lib/firebase';
// import { useRouter } from 'next/navigation';

// // Types
// interface CustomerLoginSheetProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onLoginSuccess?: () => void; // Add this prop
// }

// interface PhoneInputDetail {
//   phone_number: string;
//   country_code_length: number;
// }

// interface CountryData {
//   dialCode: string;
// }

// // SVG Components
// const CrossSvg: React.FC<{ strokeWidth?: string }> = ({ strokeWidth = '2' }) => (
//   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
//     <line x1="18" y1="6" x2="6" y2="18"></line>
//     <line x1="6" y1="6" x2="18" y2="18"></line>
//   </svg>
// );

// const EditSvg: React.FC<{ h?: string; w?: string }> = ({ h = '16', w = '16' }) => (
//   <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
//     <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
//   </svg>
// );

// // Toast Service - Replace with your actual toast service
// const toaster = {
//   warning: ({ text }: { text: string }) => {
//     // Replace with your toast implementation
//     console.warn(text);
//   },
//   success: ({ text }: { text: string }) => {
//     // Replace with your toast implementation
//     console.log(text);
//   },
//   error: ({ text }: { text: string }) => {
//     // Replace with your toast implementation
//     console.error(text);
//   }
// };

// // Success/Error Popup Component
// const PopupModal: React.FC<{
//   isOpen: boolean;
//   type: 'success' | 'error';
//   message: string;
//   onClose: () => void;
// }> = ({ isOpen, type, message, onClose }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-auto shadow-xl">
//         <div className="text-center">
//           {/* Icon at the top */}
//           <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
//             type === 'success' ? 'bg-green-100' : 'bg-red-100'
//           }`}>
//             <div className={`text-4xl ${type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
//               {type === 'success' ? '✓' : '✕'}
//             </div>
//           </div>
          
//           {/* Title */}
//           <h3 className={`text-xl font-semibold mb-2 ${
//             type === 'success' ? 'text-green-600' : 'text-red-600'
//           }`}>
//             {type === 'success' ? 'Success!' : 'Error!'}
//           </h3>
          
//           {/* Message below */}
//           <p className="text-gray-600 mb-6">{message}</p>
          
//           {/* Button */}
//           <button
//             onClick={onClose}
//             className={`px-6 py-2 rounded-lg font-medium ${
//               type === 'success' 
//                 ? 'bg-green-600 hover:bg-green-700 text-white' 
//                 : 'bg-red-600 hover:bg-red-700 text-white'
//             } transition-colors`}
//           >
//             OK
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // API Service
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_HTTPS;

// const apiService = {
//   sendOtp: async (phoneNumber: string) => {
//     const response = await fetch(`${API_BASE_URL}/customers/customer-login`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ phoneNumber }),
//     });
    
//     if (!response.ok) {
//       throw new Error('Failed to send OTP');
//     }
    
//     return response.json();
//   },

//   verifyOtp: async (phoneNumber: string, otp: string, webFcmToken: string, device_id: string) => {
//     const response = await fetch(`${API_BASE_URL}/customers/verify_web_customer`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ phoneNumber, otp, webFcmToken, device_id }),
//     });
    
//     if (!response.ok) {
//       throw new Error('Failed to verify OTP');
//     }
    
//     return response.json();
//   }
// };

// const CustomerLoginSheet: React.FC<CustomerLoginSheetProps> = ({ 
//   isOpen, 
//   onClose,
//   onLoginSuccess 
// }) => {
//   const [phoneInputDetail, setPhoneInputDetail] = useState<PhoneInputDetail>({
//     phone_number: '',
//     country_code_length: 0
//   });
//   const [otpScreen, setOtpScreen] = useState(false);
//   const [resendTimer, setResendTimer] = useState(0);
//   const [customerOtp, setCustomerOtp] = useState<string>('');
//   const [isLoading, setIsLoading] = useState(false);
//   const router = useRouter();
//   const [popup, setPopup] = useState<{
//     isOpen: boolean;
//     type: 'success' | 'error';
//     message: string;
//   }>({
//     isOpen: false,
//     type: 'success',
//     message: ''
//   });

//   const handleLoginInputField = (value: string, country: CountryData) => {
//     setPhoneInputDetail({
//       phone_number: value,
//       country_code_length: country?.dialCode?.length || 0
//     });
//   };

//   useEffect(() => {
//     // FCM Token generate karna
//     requestFcmToken().then((token) => {
//       if (token) {
//         console.log("FCM Token mil gaya:", token);
//       }
//     });

//     // Foreground messages handle karna
//     onMessageListener((payload) => {
//       console.log("Foreground message:", payload);
//     });
//   }, []);

//   // Auto-submit OTP when 4 digits are entered
//   useEffect(() => {
//     if (customerOtp.length === 4) {
//       handleSubmitOtp();
//     }
//   }, [customerOtp]);

//   const showPopup = (type: 'success' | 'error', message: string) => {
//     setPopup({
//       isOpen: true,
//       type,
//       message
//     });
//   };

//   const closePopup = () => {
//     setPopup({ isOpen: false, type: 'success', message: '' });
//   };

//   const handleCloseSheet = () => {
//     setOtpScreen(false);
//     setCustomerOtp('');
//     setPhoneInputDetail({ phone_number: '', country_code_length: 0 });
//     onClose();
//   };

//   const handleLogin = async () => {
//     if (phoneInputDetail?.phone_number?.length > 5) {
//       setIsLoading(true);
//       try {
//         const phoneNumber = String(phoneInputDetail?.phone_number)?.substring(phoneInputDetail?.country_code_length);
//         await apiService.sendOtp(phoneNumber);
//         setOtpScreen(true);
//         setResendTimer(30);
//         showPopup('success', 'OTP sent successfully!');
//       } catch (error) {
//         showPopup('error', 'Failed to send OTP. Please try again.');
//         console.error('Login error:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     } else {
//       showPopup('error', 'Please provide a valid phone number');
//     }
//   };

//   const handleResendOtp = async () => {
//     setResendTimer(30);
//     setCustomerOtp('');
//     setIsLoading(true);
//     try {
//       const phoneNumber = String(phoneInputDetail?.phone_number)?.substring(phoneInputDetail?.country_code_length);
//       await apiService.sendOtp(phoneNumber);
//       showPopup('success', 'OTP resent successfully!');
//     } catch (error) {
//       showPopup('error', 'Failed to resend OTP. Please try again.');
//       console.error('Resend OTP error:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSubmitOtp = async () => {
//     if (customerOtp && customerOtp?.length === 4) {
//       setIsLoading(true);
//       try {
//         const phoneNumber = String(phoneInputDetail?.phone_number)?.substring(phoneInputDetail?.country_code_length);
//         const fcmToken = typeof window !== 'undefined' ? localStorage.getItem('fcm_token') || '' : '';
        
//         const response = await apiService.verifyOtp(phoneNumber, customerOtp, "fcmToken", 'device_id');
        
//         if (response?.success && typeof window !== 'undefined') {
//           // Token save karo
//           if (response?.token) {
//             localStorage.setItem('auth_token', response.token);
//           }
          
//           // Customer data ko localStorage mein save karo
//           const customerData = response?.customer;
//           if (customerData) {
//             console.log('Customer Data:', customerData);
            
//             localStorage.setItem('customer_id', customerData._id || '');
//             localStorage.setItem('customer_phone', customerData.phoneNumber || '');
//             localStorage.setItem('customer_name', customerData.customerName || '');
//             localStorage.setItem('customer_email', customerData.email?.trim() || '');
            
//             // Optionally, pura customer object bhi save kar sakte ho
//             localStorage.setItem('customer_data', JSON.stringify(customerData));
//           }

//           showPopup('success', 'Login successful!');
//           localStorage.setItem('hasReloaded', 'true');
          
//           // Call the login success callback if provided
//           if (onLoginSuccess) {
//             onLoginSuccess();
//           }
          
//           // Close the sheet after a short delay
//           setTimeout(() => {
//             setOtpScreen(false);
//             handleCloseSheet();
//           }, 1500);
//         } else {
//           throw new Error('Login failed');
//         }
//       } catch (error) {
//         showPopup('error', 'Invalid OTP. Please try again.');
//         console.error('OTP verification error:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     } else {
//       showPopup('error', 'Please enter a 4-digit OTP');
//     }
//   };

//   useEffect(() => {
//     let intervalId: NodeJS.Timeout;
//     if (resendTimer > 0) {
//       intervalId = setInterval(() => {
//         setResendTimer(prev => prev - 1);
//       }, 1000);
//     }
//     return () => clearInterval(intervalId);
//   }, [resendTimer]);

//   return (
//     <>
//       <PopupModal
//         isOpen={popup.isOpen}
//         type={popup.type}
//         message={popup.message}
//         onClose={closePopup}
//       />
      
//       <Sheet open={isOpen} onOpenChange={handleCloseSheet}>
//         <SheetContent 
//           side="bottom" 
//           className="h-auto max-h-[95vh] rounded-t-[20px] p-0 overflow-y-auto border-none bg-transparent backdrop-blur-none"
//         >
//           <div className='md:h-20 bg-transparent'></div>
//           <section className="relative m-auto bg-white lg:w-[60%] md:w-[100%] sm:w-[100%] rounded-t-lg">
//             <div 
//               onClick={() => {
//                 handleCloseSheet();
//                 setOtpScreen(false);
//               }} 
//               className='cursor-pointer absolute text-[#EF4444] right-5 top-5 z-10'
//             >
//               <CrossSvg strokeWidth='3' />
//             </div>
            
//             <main className="rounded-t-lg max-w-4xl w-full mx-auto flex bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(auth-bg.png)` }}>
//               <div className='basis-full md:basis-[55%] flex flex-col p-8 max-md:px-0 pt-16 pb-32'>
//                 {otpScreen ? (
//                   <main className='flex flex-col gap-4 px-10 text-center'>
//                     <div className='text-black text-[30px] font-[500]'>OTP Verification</div>
//                     <div className='text-gray-800 flex flex-col gap-1'>
//                       <div className='text-[#757373] line-clamp-1'>A OTP(One Time Password) has been sent to</div>
//                       <div className='text-[#757373] flex items-center justify-center gap-1'>
//                         {phoneInputDetail?.phone_number?.substring(phoneInputDetail?.country_code_length)}.
//                         <div
//                           onClick={() => setOtpScreen(false)}
//                           className='bg-[#EF4444] text-white rounded-full p-1.5 cursor-pointer'
//                         >
//                           <EditSvg h='12' w='12' />
//                         </div>
//                       </div>
//                     </div>
//                     <div className='flex flex-col items-center justify-center gap-3 mt-5'>
//                       <OtpInput
//                         value={customerOtp}
//                         onChange={setCustomerOtp}
//                         numInputs={4}
//                         renderSeparator={<span>-</span>}
//                         renderInput={(props) => (
//                           <input
//                             {...props}
//                             type="tel"
//                             inputMode="numeric"
//                             pattern="[0-9]*"
//                             className='border-2 outline-none text-center rounded-md transition-colors focus:border-[#EF4444]'
//                             style={{ height: '50px', width: '50px', fontSize: '18px' }}
//                           />
//                         )}
//                       />
//                       {isLoading && customerOtp.length === 4 && (
//                         <div className="text-[#EF4444] text-sm mt-2">
//                           Verifying OTP...
//                         </div>
//                       )}
//                     </div>
//                     <div className='text-green-700 text-sm text-right'>
//                       {resendTimer > 0 ? (
//                         `Resend OTP in ${resendTimer} seconds`
//                       ) : (
//                         <button
//                           onClick={handleResendOtp}
//                           disabled={isLoading}
//                           className='text-green-700 text-sm cursor-pointer hover:text-green-600 disabled:opacity-50'
//                         >
//                           Resend OTP
//                         </button>
//                       )}
//                     </div>
//                     <button
//                       onClick={handleSubmitOtp}
//                       disabled={isLoading || customerOtp.length !== 4}
//                       className="w-full h-[45px] shadow-lg bg-[#EF4444] hover:bg-[#EF444499] focus:shadow-outline focus:outline-none text-white py-2 px-4 rounded-[10px] transition duration-300 transform hover:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
//                       type="submit"
//                     >
//                       {isLoading ? 'Verifying...' : 'Verify OTP'}
//                     </button>
//                   </main>
//                 ) : (
//                   <div className='flex flex-col items-center gap-5 px-10 text-center'>
//                     <div>
//                       <div className='text-black text-[30px] font-[500]'>Continue with Phone</div>
//                       <div className='text-[#757373] px-10'>You will receive a 4 digit code for verification</div>
//                     </div>
                    
//                     {/* New Field - Optional Name Field */}
//                     {/* <div className="w-full">
//                       <label className="block text-sm font-medium text-gray-700 text-left mb-2">
//                         Your Name (Optional)
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Enter your name"
//                         className="w-full h-[55px] px-4 border-2 border-gray-300 rounded-[10px] focus:border-[#EF4444] focus:outline-none transition-colors"
//                         onKeyDown={(e: any) => e.key === 'Enter' && handleLogin()}
//                       />
//                     </div> */}

//                     <PhoneInput
//                       country={'in'}
//                       placeholder='Enter mobile no'
//                       value={phoneInputDetail?.phone_number}
//                       onChange={handleLoginInputField}
//                       onKeyDown={(e: any) => e.key === 'Enter' && handleLogin()}
//                       inputStyle={{
//                         width: '100%',
//                         height: '55px',
//                         fontSize: '15px',
//                         backgroundColor: '#FFF',
//                         borderRadius: '10px'
//                       }}
//                     />
//                     <button
//                       onClick={handleLogin}
//                       disabled={isLoading}
//                       className="w-full h-[45px] shadow-lg bg-[#EF4444] hover:bg-[#EF444499] focus:shadow-outline focus:outline-none text-white py-2 px-4 rounded-[10px] transition duration-300 transform hover:scale-95 disabled:opacity-50"
//                       type="submit"
//                     >
//                       {isLoading ? 'Sending...' : 'GET OTP'}
//                     </button>

//                     <div className='text-[14px] font-[500] text-[#0858F7]'>
//                       By Signing, you agree to our{' '}
//                       <Link href={'/terms-of-use'} onClick={() => handleCloseSheet()} className='underline'>
//                         Terms of Use
//                       </Link>{' '}
//                       and{' '}
//                       <Link href={'/privacy-policy'} onClick={() => handleCloseSheet()} className='underline'>
//                         Privacy Policy
//                       </Link>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <div className='basis-[45%] hidden md:flex justify-center'>
//                 <div className='absolute -top-20'>
//                   <img
//                     alt="Login"
//                     loading="lazy"
//                     className="object-contain w-[80%] h-[80%]"
//                     src={`loginimage.png`} // loginimage
//                   />
//                 </div>
//               </div>
//             </main>
//           </section>
//         </SheetContent>
//       </Sheet>
//     </>
//   );
// };

// export default CustomerLoginSheet;