'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { TableColumn } from 'react-data-table-component';
import MainDatatable from '@/components/common/MainDatatable';
import DatatableHeading from '@/components/datatable/DatatableHeading';
import { base_url } from '@/lib/api-routes';
import { EditSvg, DeleteSvg } from '@/components/svgs/page';
import Swal from 'sweetalert2';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
type MessageType = 'Astrologer' | 'Customer' | '';

interface PredefinedMessage {
  _id: string;
  type: MessageType;
  message: string;
  createdAt?: string;
}

interface CSVRow {
  [key: string]: string | number | boolean | undefined;
}

// ---------------------------------------------------------------------
// Utility: Deep Search
// ---------------------------------------------------------------------
const deepSearch = <T,>(data: T[], searchText: string): T[] => {
  if (!searchText) return data;
  const lowerSearch = searchText.toLowerCase();
  return data.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(lowerSearch)
  );
};

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------
const PredefinedMessage: React.FC = () => {
  const router = useRouter();

  const [messages, setMessages] = useState<PredefinedMessage[]>([]);
  const [filteredData, setFilteredData] = useState<PredefinedMessage[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  const [inputFieldDetail, setInputFieldDetail] = useState({
    message: '',
    type: '' as MessageType,
    mode: 'Add' as 'Add' | 'Edit',
    id: '',
  });
  const [inputFieldError, setInputFieldError] = useState({
    message: '',
    type: '',
  });

  //* Handle Input Field : Error
  const handleInputFieldError = (input: keyof typeof inputFieldError, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  //* Handle Input Field : Data
  const handleInputField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInputFieldDetail({ ...inputFieldDetail, [name]: value });
    if (name in inputFieldError) {
      handleInputFieldError(name as keyof typeof inputFieldError, '');
    }
  };

  //* Handle Validation
  const handleValidation = (): boolean => {
    let isValid = true;

    if (!inputFieldDetail.message.trim()) {
      handleInputFieldError('message', 'Please enter a message');
      isValid = false;
    }
    if (!inputFieldDetail.type) {
      handleInputFieldError('type', 'Please select a type');
      isValid = false;
    }

    return isValid;
  };

  //* Handle Submit (Add or Edit)
//* Handle Submit (Add or Edit)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!handleValidation()) return;

  const { message, type, mode, id } = inputFieldDetail;

  // Use same URL for Add & Update
  const url = `${base_url}api/admin/${
    mode === 'Add' ? 'create_predefined_message' : 'update_predefined_message'
  }`;

  // Always use POST
  const method = 'POST';

  const body: any = { message, type };
  if (mode === 'Edit') body.id = id;

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(err.message || `Failed to ${mode.toLowerCase()} message`);
    }

    await Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: `Message ${mode === 'Add' ? 'created' : 'updated'} successfully!`,
      confirmButtonColor: '#3085d6',
    });

    // Reset form
    setInputFieldDetail({ message: '', type: '', mode: 'Add', id: '' });
    await fetchMessages();
  } catch (error: any) {
    console.error('Error:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: error.message || `Failed to ${mode === 'Add' ? 'create' : 'update'} message`,
      confirmButtonColor: '#d33',
    });
  }
};

  //* Fetch Messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${base_url}api/admin/get_predefined_message`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data?.result || []);
      setFilteredData(data?.result|| []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  //* Edit Message
  const handleEdit = (row: PredefinedMessage) => {
    setInputFieldDetail({
      type: row.type,
      message: row.message,
      mode: 'Edit',
      id: row._id,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  //* Delete Message
//* Delete Message
const handleDelete = async (id: string) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`${base_url}api/admin/delete_predefined_message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete');
    }

    await Swal.fire({
      title: 'Deleted!',
      text: 'Message has been deleted successfully.',
      icon: 'success',
      confirmButtonColor: '#3085d6',
    });

    await fetchMessages();
  } catch (error: any) {
    console.error('Delete error:', error);
    await Swal.fire({
      title: 'Error!',
      text: error.message || 'Failed to delete message',
      icon: 'error',
      confirmButtonColor: '#d33',
    });
  }
};

  //* Open Full Message in Modal (Placeholder)
  //* Open Full Message in Modal with SweetAlert2
const openMessageModal = (title: string, text: string) => {
  Swal.fire({
    title: title,
    text: text,
    icon: 'info',
    confirmButtonColor: '#3085d6',
    width: '600px'
  });
};

  //* Search filtering
  useEffect(() => {
    setFilteredData(deepSearch(messages, searchText));
  }, [searchText, messages]);

  //* Initial Load
  useEffect(() => {
    fetchMessages();
  }, []);

  //* CSV Data
  const csvData: CSVRow[] = useMemo(() => {
    return filteredData.map((msg, index) => ({
      'S.No.': index + 1,
      'Type': msg.type,
      'Message': msg.message,
      'Created At': msg.createdAt
        ? moment(msg.createdAt).format('DD MMM YYYY @ hh:mm a')
        : '-',
    }));
  }, [filteredData]);

  //* Datatable Columns
  const columns= useMemo(
    () => [
      {
        name: 'S.No.',
        selector: (_row:any, index?:number) => (index !== undefined ? index + 1 : 0),
        width: '80px',
      },
      {
        name: 'Type',
        selector: (row:any) => row?.type || '-',
        sortable: true,
         width: '400px',
      },
      {
        name: 'Message',
        cell: (row:any) => (
          <div
            onClick={() => openMessageModal('Message', row.message)}
            style={{
              cursor: 'pointer',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: '300px',
            }}
          >
            {row.message || 'N/A'}
          </div>
        ),
        width: '450px',
      },
      {
        name: 'Action',
        cell: (row:any) => (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div onClick={() => handleEdit(row)} style={{ cursor: 'pointer' }}>
              <EditSvg />
            </div>
            <div onClick={() => handleDelete(row._id)} style={{ cursor: 'pointer' }}>
              <DeleteSvg />
            </div>
          </div>
        ),
        width: '120px',
        center: true,
      },
    ],
    []
  );

  //* Render
  return (
    <>
      {/* Form Section */}
      <div
        style={{
          padding: '20px',
          backgroundColor: '#fff',
          marginBottom: '20px',
          boxShadow: '0px 0px 5px lightgrey',
          borderRadius: '10px',
        }}
      >
        <div
          style={{
            fontSize: '22px',
            fontWeight: '500',
            color: '#000',
            marginBottom: '30px',
          }}
        >
          Predefined Message
        </div>

    <form onSubmit={handleSubmit}>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
    {/* Select Type */}
    <div>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
        Select Type <span style={{ color: 'red' }}>*</span>
      </label>
      <select
        name="type"
        value={inputFieldDetail.type}
        onChange={handleInputField}
        onFocus={() => handleInputFieldError('type', '')}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '6px',
          border: inputFieldError.type ? '1px solid red' : '1px solid #ccc',
          fontSize: '15px',
          outline: 'none',
          backgroundColor: '#fff',
          height: '48px', // Match textarea height
        }}
      >
        <option value="" disabled>---Select Type---</option>
        <option value="Astrologer">Astrologer</option>
        <option value="Customer">Customer</option>
      </select>
      {inputFieldError.type && (
        <p style={{ color: 'red', fontSize: '13px', margin: '5px 0 0' }}>
          {inputFieldError.type}
        </p>
      )}
    </div>

    {/* Message */}
    <div>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
        Message <span style={{ color: 'red' }}>*</span>
      </label>
      <textarea
        name="message"
        value={inputFieldDetail.message}
        onChange={handleInputField}
        onFocus={() => handleInputFieldError('message', '')}
        placeholder="Enter your predefined message..."
        rows={1}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '6px',
          border: inputFieldError.message ? '1px solid red' : '1px solid #ccc',
          fontSize: '15px',
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
          height: '48px', // Same height as select
          lineHeight: '1.5',
        }}
      />
      {inputFieldError.message && (
        <p style={{ color: 'red', fontSize: '13px', margin: '5px 0 0' }}>
          {inputFieldError.message}
        </p>
      )}
    </div>
  </div>

  {/* Submit Button */}
  <div style={{ marginTop: '20px' }}>
    <button
      type="submit"
      style={{
        fontWeight: '500',
        backgroundColor: '#e63946',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '15px',
        border: 'none',
        outline: 'none',
      }}
    >
      {inputFieldDetail.mode === 'Add' ? 'Add Message' : 'Update Message'}
    </button>
  </div>
</form>
      </div>

    

        <MainDatatable
          columns={columns}
          data={filteredData}
          title="Predefined Messages"
          url="/master/predefined-messages"
          isLoading={loading}
        />
      
    </>
  );
};

export default PredefinedMessage;