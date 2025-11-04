'use client';
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Grid, TextField, Avatar, FormControl } from "@mui/material";
import Swal from "sweetalert2";
import { UploadImageSvg } from "@/components/svgs/page";

interface User {
  _id: string;
  customerName?: string;
  astrologerName?: string;
}

interface NotificationDetail {
  title: string;
  description: string;
}

interface ApiResponse<T> {
  astrologers: never[];
  success: boolean;
  data: T;
  message?: string;
}

interface SelectOption {
  value: string;
  label: string | null;
}

function AddNotificationContent(){
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as 'Customer' | 'Astrologer';
  
  const [notificationDetail, setNotificationDetail] = useState<NotificationDetail>({ 
    title: '', 
    description: '' 
  });
  const [userData, setUserData] = useState<User[]>([]);
  const [multiPage, setMultiPage] = useState<string[]>([]);
  const [inputFieldError, setInputFieldError] = useState({ 
    title: '', 
    multiPage: '',
    image: '',
    description: ''
  });
  const [image, setImage] = useState<{ file: string; bytes: File | null }>({ 
    file: '', 
    bytes: null 
  });
  const [loading, setLoading] = useState(false);

  // Get multi-page options based on type
  const multiPageOptions: SelectOption[] = userData ? [
    { value: 'all', label: 'Select All' }, 
    ...userData.map(item => ({ 
      value: item?._id, 
      label: (type === 'Customer' ? item?.customerName : item?.astrologerName) || null
    }))
  ] : [];

  // API call functions
  const getUsers = async () => {
    if (!type) return;
    
    try {
      setLoading(true);
      const endpoint = type === 'Customer' 
        ? '/api/admin/get-customers' 
        : '/api/admin/get-all-astrologers';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`);
      const data: ApiResponse<User[]> = await response.json();
      
      if (data.success) {
        setUserData(data.astrologers || []);
      } else {
        console.error(`Failed to fetch ${type.toLowerCase()}s:`, data.message);
      }
    } catch (error) {
      console.error(`Error fetching ${type.toLowerCase()}s:`, error);
    } finally {
      setLoading(false);
    }
  };

  //* Handle Input Field : Error
  const handleInputFieldError = (input: string, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  }

  //* Handle Input Field : Data
  const handleInputField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNotificationDetail({ ...notificationDetail, [name]: value });
  };

  //* Handle multi Page Option 
  const handleChangeMultiPageOption = (selectedItems: any) => {
    if (selectedItems?.some((item: any) => item?.value === 'all')) {
      setMultiPage(userData.map(item => item?._id));
    } else {
      const selectedIds = selectedItems?.map((item: any) => 
        item?.value !== 'all' ? item?.value : null
      )?.filter(Boolean);
      setMultiPage(selectedIds);
    }
  };

  //! Handle Image : Normally
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage({
        file: URL.createObjectURL(e.target.files[0]),
        bytes: e.target.files[0],
      });
    }
    handleInputFieldError("image", "");
  };

  //! Handle Image : Drop Feature
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setImage({
        file: URL.createObjectURL(e.dataTransfer.files[0]),
        bytes: e.dataTransfer.files[0],
      });
    }
    handleInputFieldError("image", "");
  };

  //! Handle Validation
  const handleValidation = () => {
    let isValid = true;
    const { title, description } = notificationDetail;

    if (!title) {
      handleInputFieldError("title", "Please Enter Title");
      isValid = false;
    }
    if (title.length > 50) {
      handleInputFieldError("title", "Please Enter Title Less Than 50 Character");
      isValid = false;
    }
    if (multiPage.length <= 0) {
      handleInputFieldError("multiPage", "Please Select At Least One User");
      isValid = false;
    }
    if (!image.bytes) {
      handleInputFieldError("image", "Please Upload an Image");
      isValid = false;
    }

    return isValid;
  };

  //! Handle Submit - Creating Notification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!handleValidation()) return;

    setLoading(true);
    const { title, description } = notificationDetail;

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (image.bytes) {
        formData.append("image", image.bytes);
      }
      formData.append("redirectTo", "Redirect");

      // Append each item in the multiPage array with a unique key
      multiPage.forEach((id, index) => {
        if (type === 'Customer') {
          formData.append(`customerIds[${index}]`, id);
        } else {
          formData.append(`astrologerIds[${index}]`, id);
        }
      });

      const endpoint = type === 'Customer' 
        ? '/api/admin/send-customer-notification'
        : '/api/admin/send-astrologer-notification';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire(
          'Success!',
          `Notification sent successfully to ${type.toLowerCase()}s.`,
          'success'
        );
        router.push(`/${type.toLowerCase()}-notification`);
      } else {
        Swal.fire(
          'Error!',
          data.message || `Failed to send ${type.toLowerCase()} notification.`,
          'error'
        );
      }
    } catch (error) {
      Swal.fire(
        'Error!',
        `Something went wrong while sending ${type.toLowerCase()} notification.`,
        'error'
      );
      console.error('Error sending notification:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (type) {
      getUsers();
    }
  }, [type]);

  if (!type) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-red-600">Error: Notification type is required</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-2xl font-semibold text-gray-900">
            Send {type} Notification
          </div>
          <button 
            onClick={() => router.push(`/${type.toLowerCase()}-notification`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Display
          </button>
        </div>

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12}>
            <div className="border border-gray-300 rounded-md">
              {image?.file ? (
                <label 
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={handleDrop} 
                  htmlFor="upload-image" 
                  className="flex flex-col items-center p-5 cursor-pointer"
                >
                  <Avatar 
                    src={image.file} 
                    sx={{ height: 300, width: 300, borderRadius: 0 }} 
                  />
                </label>
              ) : (
                <label 
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={handleDrop} 
                  htmlFor="upload-image" 
                  className="flex flex-col gap-5 items-center py-20 cursor-pointer"
                >
                  <UploadImageSvg h="80" w="80" color="#C4C4C4" />
                  <div className="font-semibold text-lg">Choose Image to Upload</div>
                  <div className="font-medium text-gray-500">Or Drop a Image Here</div>
                </label>
              )}
              <input 
                id="upload-image" 
                onChange={handleImage} 
                hidden 
                accept="image/*" 
                type="file" 
              />
            </div>
            {inputFieldError?.image && (
              <div className="text-red-600 text-xs pt-2 pl-3">
                {inputFieldError?.image}
              </div>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label={<span>Title <span className="text-red-500">*</span></span>}
              variant="outlined"
              fullWidth
              name="title"
              value={notificationDetail?.title}
              onChange={handleInputField}
              error={!!inputFieldError.title}
              helperText={inputFieldError.title}
              onFocus={() => handleInputFieldError("title", "")}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              name="description"
              value={notificationDetail?.description}
              onChange={handleInputField}
              error={!!inputFieldError.description}
              helperText={inputFieldError.description}
              onFocus={() => handleInputFieldError("description", "")}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <div className="border border-gray-300 rounded-md p-2 min-h-[45px] max-h-[150px] overflow-auto">
                <div className="flex flex-wrap gap-2">
                  {multiPageOptions.filter(option => multiPage.includes(option.value)).map(option => (
                    <div key={option.value} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {option.label}
                    </div>
                  ))}
                </div>
                <select 
                  multiple
                  value={multiPage}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setMultiPage(selected);
                  }}
                  className="w-full border-none outline-none text-sm"
                  onFocus={() => handleInputFieldError("multiPage", "")}
                >
                  {multiPageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </FormControl>
            {inputFieldError?.multiPage && (
              <div className="text-red-600 text-xs pt-2 pl-3">
                {inputFieldError?.multiPage}
              </div>
            )}
          </Grid>

          <Grid item xs={12}>
            <div className="flex justify-between">
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};
const AddNotification = () => {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen">
                <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                </div>
            </div>
        }>
            <AddNotificationContent />n
        </Suspense>
    );
};
export default AddNotification;