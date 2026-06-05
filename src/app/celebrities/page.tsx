'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MainDatatable from "@/components/common/MainDatatable";
import { EditSvg, DeleteSvg } from "@/components/svgs/page";
import Swal from "sweetalert2";

interface Celebrity {
    _id: string;
    name: string;
    image: string;
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CarouselSettings {
    desktopDuration: number;
    mobileDuration: number;
}

const BASE = process.env.NEXT_PUBLIC_API_URL;

const getCelebrities = async (): Promise<Celebrity[]> => {
    try {
        const res = await fetch(`${BASE}/api/celebrity/admin`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        return data.celebrities || [];
    } catch (err) {
        console.error(err);
        return [];
    }
};

const getSettings = async (): Promise<CarouselSettings | null> => {
    try {
        const res = await fetch(`${BASE}/api/celebrity/settings`);
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        return data.settings || null;
    } catch (err) {
        console.error(err);
        return null;
    }
};

const saveSettings = async (payload: Partial<CarouselSettings>): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE}/api/celebrity/settings`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return res.ok;
    } catch {
        return false;
    }
};

const softDelete = async (id: string): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE}/api/celebrity/${id}`, { method: "DELETE" });
        return res.ok;
    } catch {
        return false;
    }
};

const hardDelete = async (id: string): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE}/api/celebrity/${id}/permanent`, { method: "DELETE" });
        return res.ok;
    } catch {
        return false;
    }
};

const CelebritiesPage: React.FC = () => {
    const router = useRouter();
    const [data, setData] = useState<Celebrity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [settings, setSettings] = useState<CarouselSettings>({ desktopDuration: 80, mobileDuration: 40 });
    const [savingSettings, setSavingSettings] = useState(false);

    const filteredData = searchText.trim()
        ? data.filter(c => JSON.stringify(c).toLowerCase().includes(searchText.toLowerCase()))
        : data;

    const fetchAll = async () => {
        setLoading(true);
        const [celebs, s] = await Promise.all([getCelebrities(), getSettings()]);
        setData(celebs);
        if (s) setSettings(s);
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const handleEdit = (row: Celebrity) => {
        localStorage.setItem("editCelebrityData", JSON.stringify(row));
        router.push(`/celebrities/add-celebrity?id=${row._id}`);
    };

    const handleDelete = async (row: Celebrity) => {
        const result = await Swal.fire({
            title: "Delete Celebrity?",
            html: `
                <p class="text-gray-600 mb-3">Choose how you want to delete <b>${row.name}</b></p>
            `,
            icon: "warning",
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonColor: "#d33",
            denyButtonColor: "#6b7280",
            cancelButtonColor: "#d1d5db",
            confirmButtonText: "Permanent Delete",
            denyButtonText: "Deactivate Only",
            cancelButtonText: "Cancel",
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            const ok = await hardDelete(row._id);
            ok
                ? Swal.fire("Deleted!", `${row.name} permanently deleted.`, "success")
                : Swal.fire("Error!", "Failed to delete.", "error");
            if (ok) fetchAll();
        } else if (result.isDenied) {
            const ok = await softDelete(row._id);
            ok
                ? Swal.fire("Deactivated!", `${row.name} has been deactivated.`, "success")
                : Swal.fire("Error!", "Failed to deactivate.", "error");
            if (ok) fetchAll();
        }
    };

    const handleSaveSettings = async () => {
        if (settings.desktopDuration < 5 || settings.mobileDuration < 5) {
            return Swal.fire("Invalid", "Duration must be at least 5 seconds.", "warning");
        }
        setSavingSettings(true);
        const ok = await saveSettings(settings);
        setSavingSettings(false);
        ok
            ? Swal.fire("Saved!", "Carousel speed updated.", "success")
            : Swal.fire("Error!", "Failed to save settings.", "error");
    };

    const columns = [
        {
            name: "S.No.",
            selector: (_row: Celebrity, index?: number) => (index ?? 0) + 1,
            width: "70px",
        },
        {
            name: "Image",
            cell: (row: Celebrity) => (
                <div className="relative w-[50px] h-[50px]">
                    <Image
                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${row.image}`}
                        alt={row.name}
                        fill
                        className="rounded-full object-cover"
                    />
                </div>
            ),
            width: "80px",
        },
        {
            name: "Name",
            selector: (row: Celebrity) => row.name || "N/A",
            sortable: true,
            width: "180px",
        },
        {
            name: "Order",
            selector: (row: Celebrity) => row.order ?? 0,
            sortable: true,
            width: "90px",
        },
        {
            name: "Status",
            cell: (row: Celebrity) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    row.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                }`}>
                    {row.isActive ? "Active" : "Inactive"}
                </span>
            ),
            width: "100px",
        },
        {
            name: "Action",
            cell: (row: Celebrity) => (
                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => handleEdit(row)}
                        className="cursor-pointer hover:opacity-70 transition-opacity p-1"
                        title="Edit"
                    >
                        <EditSvg />
                    </button>
                    <button
                        onClick={() => handleDelete(row)}
                        className="cursor-pointer hover:opacity-70 transition-opacity p-1"
                        title="Delete"
                    >
                        <DeleteSvg />
                    </button>
                </div>
            ),
            width: "120px",
        },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-base font-semibold text-gray-800 mb-4">
                    Carousel Speed Settings
                </h2>
                <div className="flex flex-wrap gap-6 items-end">

                    {/* Desktop Speed */}
                    <div className="flex flex-col gap-1 min-w-[180px]">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Desktop Duration (sec)
                        </label>
                        <input
                            type="number"
                            min={5}
                            max={300}
                            value={settings.desktopDuration}
                            onChange={e => setSettings(p => ({ ...p, desktopDuration: Number(e.target.value) }))}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                        <p className="text-xs text-gray-400">Lower = faster. Range: 5–300</p>
                    </div>

                    {/* Mobile Speed */}
                    <div className="flex flex-col gap-1 min-w-[180px]">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Mobile Duration (sec)
                        </label>
                        <input
                            type="number"
                            min={5}
                            max={300}
                            value={settings.mobileDuration}
                            onChange={e => setSettings(p => ({ ...p, mobileDuration: Number(e.target.value) }))}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                        <p className="text-xs text-gray-400">Lower = faster. Range: 5–300</p>
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                        {savingSettings ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </div>

            <MainDatatable
                columns={columns.map(col => ({
                    ...col,
                    minwidth: col.width,
                    width: undefined,
                }))}
                title="Celebrities"
                data={filteredData}
                url="/celebrities/add-celebrity"
                showSearch={false}
            />
        </div>
    );
};

export default CelebritiesPage;