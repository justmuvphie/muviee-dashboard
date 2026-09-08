"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Sale = {
  id: string;
  order_date: string;
  buyer_name: string;
  app_name: string;
  fh: string | null;
  package_name: string | null;
  duration: string | null;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  profit: number;
  payment_method: string | null;
  order_status: string | null;
  notes: string | null;
};

type Product = {
  id: string;
  name: string;
  category: string | null;
  purchase_price: number;
  selling_price: number;
};

type MasterItem = {
  id: string;
  name: string;
};

type MasterType = "fh" | "package" | "duration" | null;

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const emptyForm = {
  order_date: new Date().toISOString().split("T")[0],
  buyer_name: "",
  app_name: "",
  fh: "",
  package_name: "",
  duration: "",
  quantity: "1",
  purchase_price: "",
  selling_price: "",
  payment_method: "QRIS",
  order_status: "Completed",
  notes: "",
};

export default function PenjualanPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [fhList, setFhList] = useState<MasterItem[]>([]);
  const [packageList, setPackageList] = useState<MasterItem[]>([]);
  const [durationList, setDurationList] = useState<MasterItem[]>([]);

  const [form, setForm] = useState(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [manageType, setManageType] = useState<MasterType>(null);
  const [selectedMasterIds, setSelectedMasterIds] = useState<string[]>([]);
  const [deletingMaster, setDeletingMaster] = useState(false);

  /* =========================
     LOAD DATA
  ========================= */

  const getSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        id,
        order_date,
        buyer_name,
        app_name,
        fh,
        package_name,
        duration,
        quantity,
        purchase_price,
        selling_price,
        profit,
        payment_method,
        order_status,
        notes
      `
      )
      .order("order_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Gagal mengambil data penjualan.");
      return;
    }

    setSales(data || []);
  };

  const getProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, purchase_price, selling_price")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setProducts(data || []);
  };

  const getFH = async () => {
    const { data, error } = await supabase
      .from("fh_list")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setFhList(data || []);
  };

  const getPackages = async () => {
    const { data, error } = await supabase
      .from("package_list")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setPackageList(data || []);
  };

  const getDurations = async () => {
    const { data, error } = await supabase
      .from("duration_list")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setDurationList(data || []);
  };

  const loadData = async () => {
    setLoading(true);

    await Promise.all([
      getSales(),
      getProducts(),
      getFH(),
      getPackages(),
      getDurations(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     MASTER MANAGEMENT
  ========================= */

  const openManage = (type: MasterType) => {
    setManageType(type);
    setSelectedMasterIds([]);
  };

  const closeManage = () => {
    setManageType(null);
    setSelectedMasterIds([]);
  };

  const getMasterTitle = () => {
    if (manageType === "fh") return "Kelola FH";
    if (manageType === "package") return "Kelola Paket";
    if (manageType === "duration") return "Kelola Durasi";
    return "";
  };

  const getMasterList = () => {
    if (manageType === "fh") return fhList;
    if (manageType === "package") return packageList;
    if (manageType === "duration") return durationList;

    return [];
  };

  const toggleMasterSelection = (id: string) => {
    setSelectedMasterIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const selectAllMaster = () => {
    const list = getMasterList();

    if (selectedMasterIds.length === list.length) {
      setSelectedMasterIds([]);
    } else {
      setSelectedMasterIds(list.map((item) => item.id));
    }
  };

  const addMasterItem = async (type: Exclude<MasterType, null>) => {
    const label =
      type === "fh"
        ? "FH"
        : type === "package"
        ? "Paket"
        : "Durasi";

    const name = prompt(`Masukkan nama ${label}:`);

    if (!name?.trim()) return;

    const table =
      type === "fh"
        ? "fh_list"
        : type === "package"
        ? "package_list"
        : "duration_list";

    const { data, error } = await supabase
      .from(table)
      .insert({
        name: name.trim(),
      })
      .select("id, name")
      .single();

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        alert(`${label} tersebut sudah ada.`);
      } else {
        alert(`Gagal menambahkan ${label}.`);
      }

      return;
    }

    if (type === "fh") {
      setFhList((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      );

      setForm((prev) => ({
        ...prev,
        fh: data.name,
      }));
    }

    if (type === "package") {
      setPackageList((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      );

      setForm((prev) => ({
        ...prev,
        package_name: data.name,
      }));
    }

    if (type === "duration") {
      setDurationList((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      );

      setForm((prev) => ({
        ...prev,
        duration: data.name,
      }));
    }
  };

  const deleteSelectedMaster = async () => {
    if (!manageType || selectedMasterIds.length === 0) return;

    const list = getMasterList();

    const selectedItems = list.filter((item) =>
      selectedMasterIds.includes(item.id)
    );

    const confirmDelete = confirm(
      `Hapus ${selectedItems.length} item yang dipilih?`
    );

    if (!confirmDelete) return;

    setDeletingMaster(true);

    const values = selectedItems.map((item) => item.name);

    let column = "";

    if (manageType === "fh") column = "fh";
    if (manageType === "package") column = "package_name";
    if (manageType === "duration") column = "duration";

    const { data: usedSales, error: salesError } = await supabase
      .from("sales")
      .select(`id, ${column}`)
      .in(column, values);

    if (salesError) {
      console.error(salesError);
      alert("Gagal mengecek data penjualan.");
      setDeletingMaster(false);
      return;
    }

    if (usedSales && usedSales.length > 0) {
      alert(
        "Ada data yang sedang digunakan di penjualan. Item tersebut tidak bisa dihapus."
      );
      setDeletingMaster(false);
      return;
    }

    const table =
      manageType === "fh"
        ? "fh_list"
        : manageType === "package"
        ? "package_list"
        : "duration_list";

    const { error } = await supabase
      .from(table)
      .delete()
      .in("id", selectedMasterIds);

    if (error) {
      console.error(error);
      alert("Gagal menghapus data.");
      setDeletingMaster(false);
      return;
    }

    if (manageType === "fh") {
      setFhList((prev) =>
        prev.filter((item) => !selectedMasterIds.includes(item.id))
      );

      if (values.includes(form.fh)) {
        setForm((prev) => ({
          ...prev,
          fh: "",
        }));
      }
    }

    if (manageType === "package") {
      setPackageList((prev) =>
        prev.filter((item) => !selectedMasterIds.includes(item.id))
      );

      if (values.includes(form.package_name)) {
        setForm((prev) => ({
          ...prev,
          package_name: "",
        }));
      }
    }

    if (manageType === "duration") {
      setDurationList((prev) =>
        prev.filter((item) => !selectedMasterIds.includes(item.id))
      );

      if (values.includes(form.duration)) {
        setForm((prev) => ({
          ...prev,
          duration: "",
        }));
      }
    }

    setSelectedMasterIds([]);
    setDeletingMaster(false);
  };

  /* =========================
     FILTER
  ========================= */

  const filteredSales = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return sales.filter((sale) => {
      const matchesSearch =
        !keyword ||
        sale.buyer_name?.toLowerCase().includes(keyword) ||
        sale.app_name?.toLowerCase().includes(keyword) ||
        sale.fh?.toLowerCase().includes(keyword) ||
        sale.package_name?.toLowerCase().includes(keyword) ||
        sale.duration?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All" || sale.order_status === statusFilter;

      const matchesStart =
        !startDate || sale.order_date >= startDate;

      const matchesEnd =
        !endDate || sale.order_date <= endDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [sales, search, statusFilter, startDate, endDate]);

  const totalOmzet = useMemo(() => {
    return filteredSales.reduce(
      (total, sale) => total + Number(sale.selling_price) * Number(sale.quantity),
      0
    );
  }, [filteredSales]);

  const totalProfit = useMemo(() => {
    return filteredSales.reduce(
      (total, sale) => total + Number(sale.profit || 0),
      0
    );
  }, [filteredSales]);

  /* =========================
     CSV
  ========================= */

  const exportCSV = () => {
    if (filteredSales.length === 0) {
      alert("Tidak ada data untuk diexport.");
      return;
    }

    const headers = [
      "Tanggal",
      "Buyer",
      "Aplikasi",
      "FH",
      "Paket",
      "Durasi",
      "Qty",
      "Modal",
      "Harga Jual",
      "Profit",
      "Payment",
      "Status",
      "Catatan",
    ];

    const rows = filteredSales.map((sale) => [
      sale.order_date,
      sale.buyer_name,
      sale.app_name,
      sale.fh || "",
      sale.package_name || "",
      sale.duration || "",
      sale.quantity,
      sale.purchase_price,
      sale.selling_price,
      sale.profit,
      sale.payment_method || "",
      sale.order_status || "",
      sale.notes || "",
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `rekapan-penjualan-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    link.click();

    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setStartDate("");
    setEndDate("");
  };

  /* =========================
     FORM
  ========================= */

  const openAddForm = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      order_date: new Date().toISOString().split("T")[0],
    });

    setShowForm(true);
  };

  const openEditForm = (sale: Sale) => {
    setEditingId(sale.id);

    setForm({
      order_date: sale.order_date || "",
      buyer_name: sale.buyer_name || "",
      app_name: sale.app_name || "",
      fh: sale.fh || "",
      package_name: sale.package_name || "",
      duration: sale.duration || "",
      quantity: String(sale.quantity || 1),
      purchase_price: String(sale.purchase_price || 0),
      selling_price: String(sale.selling_price || 0),
      payment_method: sale.payment_method || "QRIS",
      order_status: sale.order_status || "Completed",
      notes: sale.notes || "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleProductChange = (productName: string) => {
    const product = products.find(
      (item) => item.name === productName
    );

    setForm((prev) => ({
      ...prev,
      app_name: productName,
      purchase_price:
        product && product.purchase_price !== undefined
          ? String(product.purchase_price)
          : prev.purchase_price,
      selling_price:
        product && product.selling_price !== undefined
          ? String(product.selling_price)
          : prev.selling_price,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.buyer_name.trim()) {
      alert("Nama buyer wajib diisi.");
      return;
    }

    if (!form.app_name.trim()) {
      alert("Aplikasi wajib dipilih.");
      return;
    }

    if (!form.fh.trim()) {
      alert("FH wajib dipilih.");
      return;
    }

    if (!form.package_name.trim()) {
      alert("Paket wajib dipilih.");
      return;
    }

    if (!form.duration.trim()) {
      alert("Durasi wajib dipilih.");
      return;
    }

    const quantity = Number(form.quantity);
    const purchasePrice = Number(form.purchase_price);
    const sellingPrice = Number(form.selling_price);

    if (!quantity || quantity <= 0) {
      alert("Qty harus lebih dari 0.");
      return;
    }

    if (purchasePrice < 0 || sellingPrice < 0) {
      alert("Harga tidak boleh negatif.");
      return;
    }

    setSaving(true);

    const payload = {
      order_date: form.order_date,
      buyer_name: form.buyer_name.trim(),
      app_name: form.app_name.trim(),
      fh: form.fh.trim(),
      package_name: form.package_name.trim(),
      duration: form.duration.trim(),
      quantity,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      payment_method: form.payment_method,
      order_status: form.order_status,
      notes: form.notes.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("sales")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error(error);
        alert("Gagal mengubah order.");
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("sales")
        .insert(payload);

      if (error) {
        console.error(error);
        alert("Gagal menambahkan order.");
        setSaving(false);
        return;
      }
    }

    await getSales();

    setSaving(false);
    closeForm();
  };

  /* =========================
     DELETE SALE
  ========================= */

  const deleteSale = async (sale: Sale) => {
    const confirmDelete = confirm(
      `Hapus order dari "${sale.buyer_name}"?`
    );

    if (!confirmDelete) return;

    const { data: warranties, error: warrantyError } = await supabase
      .from("warranties")
      .select("id")
      .eq("sale_id", sale.id)
      .limit(1);

    if (warrantyError) {
      console.error(warrantyError);
      alert("Gagal mengecek garansi.");
      return;
    }

    if (warranties && warranties.length > 0) {
      alert(
        "Order ini masih memiliki data garansi. Hapus data garansinya terlebih dahulu."
      );
      return;
    }

    const { error } = await supabase
      .from("sales")
      .delete()
      .eq("id", sale.id);

    if (error) {
      console.error(error);
      alert("Gagal menghapus order.");
      return;
    }

    setSales((prev) =>
      prev.filter((item) => item.id !== sale.id)
    );
  };

  /* =========================
     UI
  ========================= */

  const statusClass = (status: string | null) => {
    switch (status) {
      case "Completed":
        return "bg-green-50 text-green-600";

      case "On Going":
        return "bg-blue-50 text-blue-600";

      case "Pending":
        return "bg-yellow-50 text-yellow-600";

      case "Cancelled":
        return "bg-red-50 text-red-500";

      case "Refunded":
        return "bg-purple-50 text-purple-600";

      default:
        return "bg-gray-50 text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-[#fffafd] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-pink-400">
              manage your orders ♡
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-800">
              Penjualan
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Rekap semua transaksi penjualan kamu.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="rounded-xl bg-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600"
          >
            + Tambah Order
          </button>
        </div>

        {/* SUMMARY */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400">Total Order</p>

            <p className="mt-2 text-2xl font-bold text-gray-800">
              {filteredSales.length}
            </p>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400">Total Omzet</p>

            <p className="mt-2 text-2xl font-bold text-pink-500">
              {formatRupiah(totalOmzet)}
            </p>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400">Total Profit</p>

            <p className="mt-2 text-2xl font-bold text-green-500">
              {formatRupiah(totalProfit)}
            </p>
          </div>
        </div>

        {/* FILTER */}
        <div className="mb-6 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_170px_150px_150px_auto_auto]">

            <input
              type="text"
              placeholder="Cari buyer, aplikasi, FH, paket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-pink-300"
            >
              <option value="All">All Status</option>
              <option value="Completed">Completed</option>
              <option value="On Going">On Going</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded">Refunded</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-pink-300"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-pink-300"
            />

            <button
              onClick={resetFilters}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Reset
            </button>

            <button
              onClick={exportCSV}
              className="rounded-xl bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">

          <div className="border-b border-pink-100 px-5 py-4">
            <h2 className="font-semibold text-gray-800">
              Data Penjualan
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              {filteredSales.length} data ditemukan
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-16 text-center text-sm text-gray-400">
              Loading data...
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium text-gray-500">
                Belum ada data penjualan ♡
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Tambahkan order pertama kamu.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">

                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-left">

                    <th className="whitespace-nowrap px-4 py-3 text-[11px] font-medium text-gray-400">
                      Tanggal
                    </th>

                    <th className="min-w-[130px] px-3 py-3 text-[11px] font-medium text-gray-400">
                      Buyer
                    </th>

                    <th className="min-w-[100px] px-3 py-3 text-[11px] font-medium text-gray-400">
                      Aplikasi
                    </th>

                    <th className="px-3 py-3 text-[11px] font-medium text-gray-400">
                      FH
                    </th>

                    <th className="px-3 py-3 text-[11px] font-medium text-gray-400">
                      Paket
                    </th>

                    <th className="px-3 py-3 text-[11px] font-medium text-gray-400">
                      Durasi
                    </th>

                    <th className="px-3 py-3 text-center text-[11px] font-medium text-gray-400">
                      Qty
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 text-[11px] font-medium text-gray-400">
                      Modal
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 text-[11px] font-medium text-gray-400">
                      Harga Jual
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 text-[11px] font-medium text-gray-400">
                      Profit
                    </th>

                    <th className="px-3 py-3 text-[11px] font-medium text-gray-400">
                      Status
                    </th>

                    <th className="sticky right-0 z-10 whitespace-nowrap bg-gray-50/95 px-4 py-3 text-[11px] font-medium text-gray-400">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-pink-50/30"
                    >

                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        {sale.order_date}
                      </td>

                      <td
                        className="max-w-[160px] truncate px-3 py-3 font-medium text-gray-700"
                        title={sale.buyer_name}
                      >
                        {sale.buyer_name}
                      </td>

                      <td
                        className="max-w-[130px] truncate px-3 py-3 text-gray-600"
                        title={sale.app_name}
                      >
                        {sale.app_name}
                      </td>

                      <td
                        className="max-w-[100px] truncate px-3 py-3 text-gray-500"
                        title={sale.fh || "-"}
                      >
                        {sale.fh || "-"}
                      </td>

                      <td
                        className="max-w-[110px] truncate px-3 py-3 text-gray-500"
                        title={sale.package_name || "-"}
                      >
                        {sale.package_name || "-"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                        {sale.duration || "-"}
                      </td>

                      <td className="px-3 py-3 text-center text-gray-600">
                        {sale.quantity}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                        {formatRupiah(Number(sale.purchase_price))}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-700">
                        {formatRupiah(Number(sale.selling_price))}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 font-semibold text-green-500">
                        {formatRupiah(Number(sale.profit))}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass(
                            sale.order_status
                          )}`}
                        >
                          {sale.order_status || "-"}
                        </span>
                      </td>

                      <td className="sticky right-0 z-10 whitespace-nowrap bg-white px-4 py-3 shadow-[-4px_0_8px_-6px_rgba(0,0,0,0.15)]">

                        <div className="flex gap-1.5">

                          <button
                            onClick={() => openEditForm(sale)}
                            className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-medium text-blue-500 hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteSale(sale)}
                            className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-medium text-red-500 hover:bg-red-100"
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
      </div>

      {/* =========================
          ADD / EDIT MODAL
      ========================= */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-pink-100 bg-white px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {editingId ? "Edit Order" : "Tambah Order"}
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Isi detail transaksi kamu ♡
                </p>
              </div>

              <button
                onClick={closeForm}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* Tanggal */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  Tanggal
                </label>

                <input
                  type="date"
                  value={form.order_date}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      order_date: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                  required
                />
              </div>

              {/* Buyer */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  Nama Buyer
                </label>

                <input
                  type="text"
                  placeholder="Contoh: @buyername"
                  value={form.buyer_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      buyer_name: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                  required
                />
              </div>

              {/* App */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  Aplikasi
                </label>

                <select
                  value={form.app_name}
                  onChange={(e) =>
                    handleProductChange(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-300"
                  required
                >
                  <option value="">Pilih aplikasi</option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.name}
                    >
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* FH + Package */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">
                      FH
                    </label>

                    <button
                      type="button"
                      onClick={() => openManage("fh")}
                      className="text-[10px] font-medium text-pink-500 hover:text-pink-600"
                    >
                      Kelola
                    </button>
                  </div>

                  <select
                    value={form.fh}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        fh: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-300"
                    required
                  >
                    <option value="">Pilih FH</option>

                    {fhList.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">
                      Paket
                    </label>

                    <button
                      type="button"
                      onClick={() => openManage("package")}
                      className="text-[10px] font-medium text-pink-500 hover:text-pink-600"
                    >
                      Kelola
                    </button>
                  </div>

                  <select
                    value={form.package_name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        package_name: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-300"
                    required
                  >
                    <option value="">Pilih paket</option>

                    {packageList.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Durasi */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-500">
                    Durasi
                  </label>

                  <button
                    type="button"
                    onClick={() => openManage("duration")}
                    className="text-[10px] font-medium text-pink-500 hover:text-pink-600"
                  >
                    Kelola
                  </button>
                </div>

                <select
                  value={form.duration}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-300"
                  required
                >
                  <option value="">Pilih durasi</option>

                  {durationList.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Qty + Prices */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    Qty
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-300"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    Modal / pcs
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.purchase_price}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        purchase_price: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-300"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    Harga Jual / pcs
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.selling_price}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        selling_price: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-300"
                    required
                  />
                </div>

              </div>

              {/* Profit Preview */}
              <div className="rounded-2xl bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-600">
                    Estimasi Profit
                  </span>

                  <span className="text-sm font-bold text-green-600">
                    {formatRupiah(
                      (Number(form.selling_price || 0) -
                        Number(form.purchase_price || 0)) *
                        Number(form.quantity || 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Payment + Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    Payment
                  </label>

                  <select
                    value={form.payment_method}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        payment_method: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-300"
                  >
                    <option value="QRIS">QRIS</option>
                    <option value="GoPay">GoPay</option>
                    <option value="DANA">DANA</option>
                    <option value="OVO">OVO</option>
                    <option value="ShopeePay">ShopeePay</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    Status
                  </label>

                  <select
                    value={form.order_status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        order_status: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-300"
                  >
                    <option value="Completed">Completed</option>
                    <option value="On Going">On Going</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">
                  Catatan
                </label>

                <textarea
                  rows={3}
                  placeholder="Catatan tambahan..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">

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
                  className="flex-1 rounded-xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingId
                    ? "Simpan Perubahan"
                    : "Tambah Order"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================
          MASTER MANAGEMENT MODAL
      ========================= */}

      {manageType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {getMasterTitle()}
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Tambah, pilih, atau hapus data.
                </p>
              </div>

              <button
                onClick={closeManage}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>

            </div>

            <div className="p-6">

              <div className="mb-4 flex gap-2">

                <button
                  type="button"
                  onClick={() =>
                    addMasterItem(manageType)
                  }
                  className="flex-1 rounded-xl bg-pink-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-pink-600"
                >
                  + Tambah
                </button>

                <button
                  type="button"
                  onClick={selectAllMaster}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
                >
                  {selectedMasterIds.length ===
                  getMasterList().length &&
                  getMasterList().length > 0
                    ? "Batal Pilih"
                    : "Pilih Semua"}
                </button>

              </div>

              <div className="max-h-72 overflow-y-auto rounded-2xl border border-gray-100">

                {getMasterList().length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-gray-400">
                    Belum ada data.
                  </div>
                ) : (
                  getMasterList().map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0 hover:bg-pink-50/40"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMasterIds.includes(
                          item.id
                        )}
                        onChange={() =>
                          toggleMasterSelection(item.id)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-300"
                      />

                      <span className="text-sm text-gray-600">
                        {item.name}
                      </span>
                    </label>
                  ))
                )}

              </div>

              {selectedMasterIds.length > 0 && (
                <button
                  type="button"
                  onClick={deleteSelectedMaster}
                  disabled={deletingMaster}
                  className="mt-4 w-full rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-500 hover:bg-red-100 disabled:opacity-60"
                >
                  {deletingMaster
                    ? "Menghapus..."
                    : `Hapus ${selectedMasterIds.length} item`}
                </button>
              )}

              <button
                type="button"
                onClick={closeManage}
                className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-xs font-medium text-gray-500 hover:bg-gray-50"
              >
                Selesai
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}