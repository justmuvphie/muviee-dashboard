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
  account_details: string | null;
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

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const emptyForm = {
  order_date: new Date().toISOString().split("T")[0],
  buyer_name: "",
  app_name: "",
  fh: "",
  package_name: "",
  duration: "",
  account_details: "",
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
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [selectedAccountSale, setSelectedAccountSale] =
    useState<Sale | null>(null);

  const [copiedAccount, setCopiedAccount] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [dateFilter, setDateFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [manageType, setManageType] = useState<MasterType>(null);
  const [masterName, setMasterName] = useState("");
  const [selectedMasterIds, setSelectedMasterIds] = useState<string[]>([]);
  const [savingMaster, setSavingMaster] = useState(false);

  // =========================
  // LOAD DATA
  // =========================

  const getSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select(
        "id, order_date, buyer_name, app_name, fh, package_name, duration, account_details, quantity, purchase_price, selling_price, profit, payment_method, order_status, notes, created_at"
      )
      .order("order_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Gagal mengambil data penjualan.");
      return;
    }

    setSales((data || []) as Sale[]);
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

    setProducts((data || []) as Product[]);
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

  // =========================
  // MASTER MANAGEMENT
  // =========================

  const openManage = (type: MasterType) => {
    setManageType(type);
    setMasterName("");
    setSelectedMasterIds([]);
  };

  const closeManage = () => {
    setManageType(null);
    setMasterName("");
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
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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

  const addMasterItem = async () => {
    if (!manageType || !masterName.trim()) return;

    setSavingMaster(true);

    let table = "";

    if (manageType === "fh") table = "fh_list";
    if (manageType === "package") table = "package_list";
    if (manageType === "duration") table = "duration_list";

    const { error } = await supabase
      .from(table)
      .insert({ name: masterName.trim() });

    setSavingMaster(false);

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        alert("Nama tersebut sudah ada.");
      } else {
        alert("Gagal menambahkan data.");
      }

      return;
    }

    setMasterName("");

    if (manageType === "fh") await getFH();
    if (manageType === "package") await getPackages();
    if (manageType === "duration") await getDurations();
  };

  const deleteSelectedMaster = async () => {
    if (!manageType || selectedMasterIds.length === 0) return;

    const confirmed = confirm(
      `Hapus ${selectedMasterIds.length} data yang dipilih?`
    );

    if (!confirmed) return;

    let table = "";

    if (manageType === "fh") table = "fh_list";
    if (manageType === "package") table = "package_list";
    if (manageType === "duration") table = "duration_list";

    const { error } = await supabase
      .from(table)
      .delete()
      .in("id", selectedMasterIds);

    if (error) {
      console.error(error);
      alert("Gagal menghapus data.");
      return;
    }

    setSelectedMasterIds([]);

    if (manageType === "fh") await getFH();
    if (manageType === "package") await getPackages();
    if (manageType === "duration") await getDurations();
  };

  // =========================
  // FILTER
  // =========================

  const filteredSales = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return sales.filter((sale) => {
      const matchesSearch =
        !keyword ||
        sale.buyer_name?.toLowerCase().includes(keyword) ||
        sale.app_name?.toLowerCase().includes(keyword) ||
        sale.fh?.toLowerCase().includes(keyword) ||
        sale.package_name?.toLowerCase().includes(keyword) ||
        sale.duration?.toLowerCase().includes(keyword) ||
        sale.account_details?.toLowerCase().includes(keyword) ||
        sale.notes?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "Semua" || sale.order_status === statusFilter;

      const matchesDate =
        !dateFilter || sale.order_date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [sales, search, statusFilter, dateFilter]);

  // =========================
  // SUMMARY
  // =========================

  const totalOrder = filteredSales.length;

  const totalOmzet = filteredSales.reduce(
    (total, sale) => total + Number(sale.selling_price || 0) * sale.quantity,
    0
  );

  const totalProfit = filteredSales.reduce(
    (total, sale) => total + Number(sale.profit || 0),
    0
  );

  // =========================
  // CSV
  // =========================

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
      "Detail Akun",
      "Qty",
      "Modal",
      "Harga Jual",
      "Profit",
      "Payment",
      "Status",
      "Catatan",
    ];

    const escapeCSV = (value: unknown) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredSales.map((sale) => [
      sale.order_date,
      sale.buyer_name,
      sale.app_name,
      sale.fh || "",
      sale.package_name || "",
      sale.duration || "",
      sale.account_details || "",
      sale.quantity,
      sale.purchase_price,
      sale.selling_price,
      sale.profit,
      sale.payment_method || "",
      sale.order_status || "",
      sale.notes || "",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `rekapan-penjualan-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;

    link.click();

    URL.revokeObjectURL(url);
  };

  // =========================
  // FORM
  // =========================

  const openAddForm = () => {
    setEditingSale(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (sale: Sale) => {
    setEditingSale(sale);

    setForm({
      order_date: sale.order_date || "",
      buyer_name: sale.buyer_name || "",
      app_name: sale.app_name || "",
      fh: sale.fh || "",
      package_name: sale.package_name || "",
      duration: sale.duration || "",
      account_details: sale.account_details || "",
      quantity: String(sale.quantity || 1),
      purchase_price:
        sale.purchase_price !== null && sale.purchase_price !== undefined
          ? String(sale.purchase_price)
          : "",
      selling_price:
        sale.selling_price !== null && sale.selling_price !== undefined
          ? String(sale.selling_price)
          : "",
      payment_method: sale.payment_method || "QRIS",
      order_status: sale.order_status || "Completed",
      notes: sale.notes || "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSale(null);
    setForm(emptyForm);
  };

  const handleProductChange = (productName: string) => {
    const product = products.find((item) => item.name === productName);

    if (!product) {
      setForm((prev) => ({
        ...prev,
        app_name: productName,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      app_name: product.name,
      purchase_price: String(product.purchase_price ?? ""),
      selling_price: String(product.selling_price ?? ""),
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

    const quantity = Number(form.quantity) || 1;
    const purchasePrice = Number(form.purchase_price) || 0;
    const sellingPrice = Number(form.selling_price) || 0;

    setSaving(true);

    const payload = {
      order_date: form.order_date,
      buyer_name: form.buyer_name.trim(),
      app_name: form.app_name.trim(),
      fh: form.fh.trim() || null,
      package_name: form.package_name.trim() || null,
      duration: form.duration.trim() || null,
      account_details: form.account_details.trim() || null,
      quantity,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      payment_method: form.payment_method || null,
      order_status: form.order_status || null,
      notes: form.notes.trim() || null,
    };

    let error;

    if (editingSale) {
      const result = await supabase
        .from("sales")
        .update(payload)
        .eq("id", editingSale.id);

      error = result.error;
    } else {
      const result = await supabase.from("sales").insert(payload);

      error = result.error;
    }

    setSaving(false);

    if (error) {
      console.error(error);
      alert(`Gagal menyimpan order: ${error.message}`);
      return;
    }

    closeForm();
    await getSales();
  };

  // =========================
  // DELETE
  // =========================

  const deleteSale = async (sale: Sale) => {
    const confirmed = confirm(
      `Hapus order dari ${sale.buyer_name}? Data yang sudah dihapus tidak bisa dikembalikan.`
    );

    if (!confirmed) return;

    const { data: warranties, error: warrantyError } = await supabase
      .from("warranties")
      .select("id")
      .eq("sale_id", sale.id)
      .limit(1);

    if (warrantyError) {
      console.error(warrantyError);
      alert("Gagal mengecek data garansi.");
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

    await getSales();
  };

  // =========================
  // ACCOUNT DETAIL
  // =========================

  const openAccountDetail = (sale: Sale) => {
    setSelectedAccountSale(sale);
    setCopiedAccount(false);
  };

  const closeAccountDetail = () => {
    setSelectedAccountSale(null);
    setCopiedAccount(false);
  };

  const copyAccountDetail = async () => {
    if (!selectedAccountSale?.account_details) {
      alert("Belum ada detail akun.");
      return;
    }

    try {
      await navigator.clipboard.writeText(
        selectedAccountSale.account_details
      );

      setCopiedAccount(true);

      setTimeout(() => {
        setCopiedAccount(false);
      }, 2000);
    } catch (error) {
      console.error(error);
      alert("Gagal menyalin detail akun.");
    }
  };

  // =========================
  // PROFIT PREVIEW
  // =========================

  const previewProfit =
    ((Number(form.selling_price) || 0) -
      (Number(form.purchase_price) || 0)) *
    (Number(form.quantity) || 1);

  return (
    <div className="min-h-screen bg-[#fffafd]">
      {/* HEADER */}
      <div className="border-b border-pink-100 bg-white px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-pink-400">
                manage your orders ♡
              </p>

              <h1 className="mt-1 text-2xl font-semibold text-gray-800">
                Penjualan
              </h1>

              <p className="mt-1 text-xs text-gray-400">
                Kelola semua rekapan pembelian dan profit kamu.
              </p>
            </div>

            <button
              onClick={openAddForm}
              className="rounded-xl bg-pink-500 px-4 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-pink-600"
            >
              + Tambah Order
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
        {/* SUMMARY */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-pink-100 bg-white p-4">
            <p className="text-[11px] text-gray-400">Total Order</p>
            <p className="mt-1 text-xl font-semibold text-gray-800">
              {totalOrder}
            </p>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-white p-4">
            <p className="text-[11px] text-gray-400">Omzet</p>
            <p className="mt-1 text-xl font-semibold text-gray-800">
              {formatRupiah(totalOmzet)}
            </p>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-white p-4">
            <p className="text-[11px] text-gray-400">Profit</p>
            <p className="mt-1 text-xl font-semibold text-pink-500">
              {formatRupiah(totalProfit)}
            </p>
          </div>
        </div>

        {/* FILTER */}
        <div className="mt-5 rounded-2xl border border-pink-100 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari buyer, aplikasi, akun, paket..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-pink-300 focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-600 outline-none focus:border-pink-300"
            >
              <option value="Semua">Semua Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-600 outline-none focus:border-pink-300"
            />

            <button
              onClick={exportCSV}
              className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-xs font-medium text-pink-500 transition hover:bg-pink-100"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-pink-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="whitespace-nowrap px-3 py-3 text-[11px] font-medium text-gray-400">
                    Tanggal
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-[11px] font-medium text-gray-400">
                    Buyer
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-[11px] font-medium text-gray-400">
                    Aplikasi
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-[11px] font-medium text-gray-400">
                    Paket
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-[11px] font-medium text-gray-400">
                    Durasi
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-[11px] font-medium text-gray-400">
                    Qty
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-[11px] font-medium text-gray-400">
                    Profit
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-[11px] font-medium text-gray-400">
                    Status
                  </th>

                  <th className="sticky right-0 z-10 whitespace-nowrap bg-gray-50/95 px-4 py-3 text-[11px] font-medium text-gray-400">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-xs text-gray-400"
                    >
                      Loading data...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-xs text-gray-400"
                    >
                      Belum ada data penjualan ♡
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-gray-50 transition hover:bg-pink-50/30"
                    >
                      {/* TANGGAL */}
                      <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-gray-500">
                        {sale.order_date}
                      </td>

                      {/* BUYER + CATATAN */}
                      <td className="max-w-[190px] px-3 py-3 align-top">
                        <div
                          className="truncate text-xs font-medium text-gray-700"
                          title={sale.buyer_name}
                        >
                          {sale.buyer_name}
                        </div>

                        {sale.notes && (
                          <div
                            className="mt-0.5 max-w-[190px] truncate text-[10px] text-gray-400"
                            title={sale.notes}
                          >
                            ↳ {sale.notes}
                          </div>
                        )}
                      </td>

                      {/* APLIKASI + FH */}
                      <td className="max-w-[150px] px-3 py-3 align-top">
                        <div
                          className="truncate text-xs text-gray-600"
                          title={sale.app_name}
                        >
                          {sale.app_name}
                        </div>

                        {sale.fh && (
                          <div
                            className="mt-0.5 truncate text-[10px] text-gray-400"
                            title={sale.fh}
                          >
                            FH · {sale.fh}
                          </div>
                        )}
                      </td>

                      {/* PAKET */}
                      <td className="max-w-[120px] px-3 py-3 align-top">
                        <div
                          className="truncate text-xs text-gray-600"
                          title={sale.package_name || ""}
                        >
                          {sale.package_name || "-"}
                        </div>
                      </td>

                      {/* DURASI */}
                      <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-gray-500">
                        {sale.duration || "-"}
                      </td>

                      {/* QTY */}
                      <td className="px-3 py-3 align-top text-xs text-gray-500">
                        {sale.quantity}
                      </td>

                      {/* PROFIT */}
                      <td className="whitespace-nowrap px-3 py-3 align-top">
                        <span className="text-xs font-medium text-pink-500">
                          {formatRupiah(Number(sale.profit || 0))}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-3 py-3 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            sale.order_status === "Completed"
                              ? "bg-green-50 text-green-500"
                              : sale.order_status === "Pending"
                              ? "bg-yellow-50 text-yellow-500"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {sale.order_status || "-"}
                        </span>
                      </td>

                      {/* AKSI STICKY */}
                      <td className="sticky right-0 z-10 whitespace-nowrap bg-white px-4 py-3 shadow-[-4px_0_8px_-6px_rgba(0,0,0,0.15)]">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openAccountDetail(sale)}
                            className="rounded-lg bg-pink-50 px-2.5 py-1.5 text-[10px] font-medium text-pink-500 hover:bg-pink-100"
                          >
                            Detail
                          </button>

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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* =========================
          ADD / EDIT MODAL
      ========================= */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 flex items-center justify-between border-b border-pink-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {editingSale ? "Edit Order" : "Tambah Order"}
                </h2>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  Isi detail transaksi kamu ♡
                </p>
              </div>

              <button
                onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto px-6 py-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* DATE */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:bg-white"
                  />
                </div>

                {/* BUYER */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                    Buyer
                  </label>

                  <input
                    type="text"
                    value={form.buyer_name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        buyer_name: e.target.value,
                      }))
                    }
                    placeholder="Nama buyer"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-pink-300 focus:bg-white"
                  />
                </div>

                {/* APP */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                    Aplikasi
                  </label>

                  <select
                    value={form.app_name}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:bg-white"
                  >
                    <option value="">Pilih aplikasi</option>

                    {products.map((product) => (
                      <option key={product.id} value={product.name}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FH */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[11px] font-medium text-gray-500">
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:bg-white"
                  >
                    <option value="">Pilih FH</option>

                    {fhList.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PACKAGE */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[11px] font-medium text-gray-500">
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:bg-white"
                  >
                    <option value="">Pilih paket</option>

                    {packageList.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DURATION */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[11px] font-medium text-gray-500">
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:bg-white"
                  >
                    <option value="">Pilih durasi</option>

                    {durationList.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ACCOUNT DETAIL */}
              <div className="mt-4">
                <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                  Detail Akun
                </label>

                <textarea
                  value={form.account_details}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      account_details: e.target.value,
                    }))
                  }
                  rows={5}
                  placeholder={`Tempel detail akun di sini...

Contoh:
email: xxx@gmail.com
password: xxxxx
profile: 2
pin: 1234`}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs leading-5 text-gray-700 outline-none placeholder:text-gray-400 focus:border-pink-300 focus:bg-white"
                />

                <p className="mt-1.5 text-[10px] text-gray-400">
                  Bisa isi bebas dan nanti bisa langsung dicopy dari tombol
                  Detail.
                </p>
              </div>

              {/* QTY + PRICES */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                    Modal
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
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                    Harga Jual
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
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:bg-white"
                  />
                </div>
              </div>

              {/* PROFIT PREVIEW */}
              <div className="mt-4 rounded-2xl border border-pink-100 bg-pink-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    Estimasi Profit
                  </span>

                  <span className="text-sm font-semibold text-pink-500">
                    {formatRupiah(previewProfit)}
                  </span>
                </div>
              </div>

              {/* PAYMENT + STATUS */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:bg-white"
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
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:bg-white"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* NOTES */}
              <div className="mt-4">
                <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                  Catatan
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Catatan kecil untuk order ini..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-pink-300 focus:bg-white"
                />
              </div>

              {/* BUTTON */}
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-500 hover:bg-gray-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-pink-500 px-4 py-3 text-xs font-medium text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingSale
                    ? "Simpan Perubahan"
                    : "Simpan Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          DETAIL AKUN MODAL
      ========================= */}
      {selectedAccountSale && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Detail Akun
                </h2>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  {selectedAccountSale.app_name} ·{" "}
                  {selectedAccountSale.buyer_name}
                </p>
              </div>

              <button
                onClick={closeAccountDetail}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <pre className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                  {selectedAccountSale.account_details ||
                    "Belum ada detail akun."}
                </pre>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={copyAccountDetail}
                  disabled={!selectedAccountSale.account_details}
                  className="flex-1 rounded-xl bg-pink-500 px-4 py-3 text-xs font-medium text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copiedAccount ? "✓ Berhasil Dicopy" : "Copy Detail"}
                </button>

                <button
                  onClick={closeAccountDetail}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-xs font-medium text-gray-500 hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          MASTER MANAGEMENT MODAL
      ========================= */}
      {manageType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {getMasterTitle()}
                </h2>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  Tambah atau hapus pilihan.
                </p>
              </div>

              <button
                onClick={closeManage}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* ADD */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={masterName}
                  onChange={(e) => setMasterName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMasterItem();
                    }
                  }}
                  placeholder="Nama baru..."
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-pink-300 focus:bg-white"
                />

                <button
                  type="button"
                  onClick={addMasterItem}
                  disabled={savingMaster || !masterName.trim()}
                  className="rounded-xl bg-pink-500 px-4 py-2.5 text-xs font-medium text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tambah
                </button>
              </div>

              {/* LIST */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={selectAllMaster}
                    className="text-[10px] font-medium text-pink-500 hover:text-pink-600"
                  >
                    {selectedMasterIds.length === getMasterList().length &&
                    getMasterList().length > 0
                      ? "Batal pilih semua"
                      : "Pilih semua"}
                  </button>

                  {selectedMasterIds.length > 0 && (
                    <button
                      type="button"
                      onClick={deleteSelectedMaster}
                      className="text-[10px] font-medium text-red-500 hover:text-red-600"
                    >
                      Hapus terpilih ({selectedMasterIds.length})
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-100">
                  {getMasterList().length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-gray-400">
                      Belum ada data.
                    </div>
                  ) : (
                    getMasterList().map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-b-0 hover:bg-pink-50/40"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMasterIds.includes(item.id)}
                          onChange={() => toggleMasterSelection(item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-300"
                        />

                        <span className="text-xs text-gray-600">
                          {item.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={closeManage}
                className="mt-5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-500 hover:bg-gray-50"
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