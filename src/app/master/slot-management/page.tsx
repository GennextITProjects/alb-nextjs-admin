'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { TableColumn } from 'react-data-table-component';
import MainDatatable from '@/components/common/MainDatatable';
import DatatableHeading from '@/components/datatable/DatatableHeading';
import { base_url } from '@/lib/api-routes';
import { SwitchOnSvg, SwitchOffSvg } from '@/components/svgs/page';
import Swal from 'sweetalert2';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface SlotDuration {
  _id: string;
  slotDuration: number;
  active: boolean;
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
const SlotManagement: React.FC = () => {
  const router = useRouter();

  const [slotDurations, setSlotDurations] = useState<SlotDuration[]>([]);
  const [filteredData, setFilteredData] = useState<SlotDuration[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingSlotId, setUpdatingSlotId] = useState<string | null>(null);

  const [inputFieldDetail, setInputFieldDetail] = useState({ slot_duration: '' });
  const [inputFieldError, setInputFieldError] = useState({ slot_duration: '' });

  //* Handle Input Field : Error
  const handleInputFieldError = (input: string, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  //* Handle Input Field : Data
  const handleInputField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputFieldDetail({ ...inputFieldDetail, [name]: value ? Number(value) : '' });
    handleInputFieldError(name, '');
  };

  //* Handle Validation
  const handleValidation = (): boolean => {
    let isValid = true;
    const { slot_duration } = inputFieldDetail;

    const duration = Number(slot_duration);
    if (!slot_duration || duration <= 0) {
      handleInputFieldError('slot_duration', 'Please enter a valid slot duration');
      isValid = false;
    }

    return isValid;
  };

  //* Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handleValidation()) return;

    const { slot_duration } = inputFieldDetail;

    try {
      const res = await fetch(`${base_url}api/admin/create_slots_duration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotDuration: slot_duration }),
      });

      if (!res.ok) throw new Error('Failed to create slot duration');

      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Slot duration created successfully!',
        confirmButtonColor: '#3085d6',
      });

      setInputFieldDetail({ slot_duration: '' });
      await fetchSlotDurations();
    } catch (error) {
      console.error('Error creating slot duration:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to create slot duration. Please try again.',
        confirmButtonColor: '#d33',
      });
    }
  };

  //* Fetch Slot Durations
  const fetchSlotDurations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${base_url}api/admin/get_slots_duration`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch slot durations');

      const data = await res.json();
      console.log('API Response:', data); // Debug log
      
      const slots = data?.slots || [];

      // Sort in ascending order by slotDuration
      const sortedSlots = slots.sort(
        (a: SlotDuration, b: SlotDuration) => a.slotDuration - b.slotDuration
      );

      setSlotDurations(sortedSlots);
      setFilteredData(sortedSlots);
    } catch (err) {
      console.error('Error fetching slot durations:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to fetch slot durations.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  //* Update Slot Status - FIXED VERSION
  const updateSlotStatus = async (slotId: string) => {
    // Prevent multiple simultaneous updates
    if (updatingSlotId) {
      console.log('Already updating a slot, please wait...');
      return;
    }

    try {
      setUpdatingSlotId(slotId);

      // Optimistic update - update UI immediately
      setSlotDurations((prevData) =>
        prevData.map((slot) =>
          slot._id === slotId
            ? { ...slot, active: !slot.active }
            : slot
        )
      );
      setFilteredData((prevData) =>
        prevData.map((slot) =>
          slot._id === slotId
            ? { ...slot, active: !slot.active }
            : slot
        )
      );

      console.log('Updating slot status for ID:', slotId);
      
      const res = await fetch(`${base_url}api/admin/update_slots_duration_status/${slotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', res.status);

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await res.json();
      console.log('Status update response:', data);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      // Success - fetch fresh data to ensure consistency
      await fetchSlotDurations();

      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Slot status updated successfully!',
        timer: 1500,
        showConfirmButton: false,
      });

    } catch (error) {
      console.error('Error updating slot status:', error);
      
      // Revert optimistic update on error
      await fetchSlotDurations();

      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to update slot status.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setUpdatingSlotId(null);
    }
  };

  //* Search filtering
  useEffect(() => {
    setFilteredData(deepSearch(slotDurations, searchText));
  }, [searchText, slotDurations]);

  //* Initial Load
  useEffect(() => {
    fetchSlotDurations();
  }, []);

  //* CSV Data (Transformed for Export)
  const csvData: CSVRow[] = useMemo(() => {
    return filteredData.map((slot, index) => ({
      'S.No.': index + 1,
      'Slot Duration (mins)': slot.slotDuration,
      'Status': slot.active ? 'Active' : 'Inactive',
      'Created At': slot.createdAt
        ? moment(slot.createdAt).format('DD MMM YYYY @ hh:mm a')
        : '-',
    }));
  }, [filteredData]);

  //* Datatable Columns
  const columns = useMemo(
    () => [
      {
        name: 'S.No.',
        selector: (_row: any, index?: number) => (index !== undefined ? index + 1 : 0),
        width: '80px',
      },
      {
        name: 'Slot Duration (mins)',
        selector: (row: any) => row?.slotDuration ?? '-',
      },
      {
        name: 'Status',
        cell: (row: any) => (
          <div
            style={{ 
              cursor: updatingSlotId === row._id ? 'wait' : 'pointer',
              opacity: updatingSlotId === row._id ? 0.6 : 1,
            }}
            onClick={() => updateSlotStatus(row._id)}
          >
            {row?.active ? <SwitchOnSvg /> : <SwitchOffSvg />}
          </div>
        ),
        width: '140px',
        center: true,
      },
    ],
    [updatingSlotId]
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
          Slot Management
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label
                style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}
              >
                Slot Duration (in minutes) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="slot_duration"
                value={inputFieldDetail.slot_duration}
                onChange={handleInputField}
                onFocus={() => handleInputFieldError('slot_duration', '')}
                placeholder="e.g., 30"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: inputFieldError.slot_duration
                    ? '1px solid red'
                    : '1px solid #ccc',
                  fontSize: '15px',
                  outline: 'none',
                  boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.1)',
                }}
              />
              {inputFieldError.slot_duration && (
                <p style={{ color: 'red', fontSize: '13px', margin: '5px 0 0' }}>
                  {inputFieldError.slot_duration}
                </p>
              )}
            </div>

            <div>
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
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>

    
        <MainDatatable
          columns={columns}
          data={filteredData}
          title="Slot Management"
          url="/master/slot-management"
          isLoading={loading}
        />

    </>
  );
};

export default SlotManagement;