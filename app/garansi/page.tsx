"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Sale = {
  id: number;
  buyer_name: string;
  app_name: string;
  package_name: string;
};

type Warranty = {
  id: number;
  sale_id: number;
  buyer_name: string;
  app_name: string;
  package_name: string;
  warranty_status: string;
  claim_date: string;
  claim_reason: string;
  notes: string;
};

const emptyForm = {
  sale_id: "",
  warranty_status: "Active",
  claim_date: new Date().toISOString().split("T")[0],
  claim_reason: "",
  notes: "",
};

export default function GaransiPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [form, setForm] = useState(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function getWarranties() {
    const { data, error } = await supabase
      .from("warranties")
      .select(
        "id, sale_id, buyer_name, app_name, package_name, warranty_status, claim_date, claim_reason, notes"
      )
      .order("id", { ascending: false });

    if (error) {
      alert("Gagal mengambil data garansi: " + error.message);
      return;
    }

    setWarranties((data || []) as Warranty[]);
  }

  async function getSales() {
    const { data, error } = await supabase
      .from("sales")
      .select("id, buyer_name, app_name, package_name")
      .order("id", { ascending: false });

    if (!error && data) {
      setSales(data as Sale[]);
    }
  }

  async function loadData() {
    setLoading(true);
    await Promise.all([getWarranties(), getSales()]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredWarranties = useMemo(() => {
    return warranties.filter((warranty) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        warranty.buyer_name?.toLowerCase().includes(keyword) ||
        warranty.app_name?.toLowerCase().includes(keyword) ||
        warranty.package_name?.toLowerCase().includes(keyword) ||
        warranty.claim_reason?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All" ||
        warranty.warranty_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [warranties, search, statusFilter]);

  const activeCount = warranties.filter(
    (item) => item.warranty_status === "Active"
  ).length;

  const pendingCount = warranties.filter(
    (item) => item.warranty_status === "Pending"
  ).length;

  const resolvedCount = warranties.filter(
    (item) => item.warranty_status === "Resolved"
  ).length;

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(warranty: Warranty) {
    setEditingId(warranty.id);

    setForm({
      sale_id: String(warranty.sale_id || ""),
      warranty_status: warranty.warranty_status || "Active",
      claim_date:
        warranty.claim_date ||
        new Date().toISOString().split("T")[0],
      claim_reason: warranty.claim_reason || "",
      notes: warranty.notes || "",
    });

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.sale_id) {
      alert("Pilih order terlebih dahulu.");
      return;
    }

    setSaving(true);

    const selectedSale = sales.find(
      (sale) => sale.id === Number(form.sale_id)
    );

    if (!selectedSale) {
      alert("Order tidak ditemukan.");
      setSaving(false);
      return;
    }

    const warrantyData = {
      sale_id: selectedSale.id,
      buyer_name: selectedSale.buyer_name,
      app_name: selectedSale.app_name,
      package_name: selectedSale.package_name,
      warranty_status: form.warranty_status,
      claim_date: form.claim_date,
      claim_reason: form.claim_reason.trim(),
      notes: form.notes.trim(),
    };

    let error;

    if (editingId) {
      const response = await supabase
        .from("warranties")
        .update(warrantyData)
        .eq("id", editingId);

      error = response.error;
    } else {
      const response = await supabase
        .from("warranties")
        .insert([warrantyData]);

      error = response.error;
    }

    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      alert(
        editingId
          ? "Data garansi berhasil diperbarui ♡"
          : "Garansi berhasil ditambahkan ♡"
      );

      closeForm();
      await getWarranties();
    }

    setSaving(false);
  }

  async function deleteWarranty(warranty: Warranty) {
    const confirmed = confirm(
      `Hapus data garansi ${warranty.buyer_name} - ${warranty.app_name}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("warranties")
      .delete()
      .eq("id", warranty.id);

    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }

    alert("Data garansi berhasil dihapus.");
    await getWarranties();
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />
          <p className="text-sm text-gray-400">
            Loading garansi...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm text-pink-400">
            keep your buyers covered ♡
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-800">
            Garansi
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Kelola klaim dan status garansi buyer.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="rounded-xl bg-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-pink-600"
        >
          + Tambah Garansi
        </button>
      </div>

      {/* SUMMARY */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">
            Total Garansi
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-800">
            {warranties.length}
          </p>
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">Active</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">Pending</p>
          <p className="mt-2 text-2xl font-bold text-yellow-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">Resolved</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {resolvedCount}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm md:flex-row">
        <input
          type="text"
          placeholder="Cari buyer, aplikasi, paket..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
        >
          <option value="All">Semua Status</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
        <div className="border-b border-pink-100 px-6 py-5">
          <h2 className="font-semibold text-gray-800">
            Data Garansi
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            {filteredWarranties.length} data ditemukan
          </p>
        </div>

        {filteredWarranties.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-4xl">🛡️</div>

            <p className="mt-3 font-medium text-gray-600">
              Belum ada data garansi
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Tambahkan garansi dari order yang sudah ada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs text-gray-400">
                    Buyer
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Aplikasi
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Paket
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Claim Date
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Alasan
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs text-gray-400">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredWarranties.map((warranty) => (
                  <tr
                    key={warranty.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-pink-50/30"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-700">
                        {warranty.buyer_name}
                      </p>

                      <p className="mt-1 text-[10px] text-gray-400">
                        Order #{warranty.sale_id}
                      </p>
                    </td>

                    <td className="px-4 py-4 font-medium text-gray-700">
                      {warranty.app_name}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {warranty.package_name}
                    </td>

                    <td className="px-4 py-4 text-gray-500">
                      {warranty.claim_date
                        ? new Date(
                            `${warranty.claim_date}T00:00:00`
                          ).toLocaleDateString("id-ID")
                        : "-"}
                    </td>

                    <td className="px-4 py-4">
                      <p className="max-w-[200px] truncate text-gray-600">
                        {warranty.claim_reason || "-"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-medium ${
                          warranty.warranty_status === "Active"
                            ? "bg-green-50 text-green-600"
                            : warranty.warranty_status === "Pending"
                            ? "bg-yellow-50 text-yellow-600"
                            : warranty.warranty_status === "Resolved"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {warranty.warranty_status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(warranty)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-500 hover:bg-blue-100"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteWarranty(warranty)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-pink-100 bg-white px-6 py-5">
              <div>
                <h2 className="font-semibold text-gray-800">
                  {editingId
                    ? "Edit Garansi"
                    : "Tambah Garansi"}
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Hubungkan garansi dengan order buyer.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="rounded-lg px-3 py-2 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Pilih Order
                </label>

                <select
                  value={form.sale_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sale_id: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-400"
                  required
                >
                  <option value="">
                    Pilih order buyer
                  </option>

                  {sales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      #{sale.id} — {sale.buyer_name} —{" "}
                      {sale.app_name} — {sale.package_name}
                    </option>
                  ))}
                </select>

                {sales.length === 0 && (
                  <p className="mt-2 text-xs text-red-400">
                    Belum ada order. Tambahkan penjualan
                    terlebih dahulu.
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Status Garansi
                  </label>

                  <select
                    value={form.warranty_status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        warranty_status: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-400"
                  >
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Resolved</option>
                    <option>Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Tanggal Claim
                  </label>

                  <input
                    type="date"
                    value={form.claim_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        claim_date: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Alasan Claim
                </label>

                <textarea
                  value={form.claim_reason}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      claim_reason: e.target.value,
                    })
                  }
                  placeholder="Contoh: akun tidak bisa login..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Catatan
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Catatan tambahan..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingId
                    ? "Simpan Perubahan"
                    : "Tambah Garansi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}