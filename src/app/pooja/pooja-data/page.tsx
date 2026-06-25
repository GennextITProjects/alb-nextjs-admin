'use client';

import { useState, useEffect } from 'react';

interface PoojaData {
  _id: string;
  heading: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function PoojaDataPage() {
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing data on mount, since it's a single record
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/pooja-data`);
        if (res.ok) {
          const json = await res.json();
          setHeading(json.data?.heading || '');
          setDescription(json.data?.description || '');
        }
      } catch (err) {
        console.error('Failed to load pooja data', err);
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!heading.trim() || !description.trim()) {
      setMessage({ type: 'error', text: 'Heading and description are required.' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/pooja-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading, description }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Something went wrong');
      }

      setMessage({ type: 'success', text: 'Pooja data saved successfully!' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save data';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-semibold text-gray-800">
          Pooja Data
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="heading" className="mb-1 block text-sm font-medium text-gray-700">
              Heading
            </label>
            <input
              id="heading"
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Enter heading"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={5}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 text-gray-800 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
} 