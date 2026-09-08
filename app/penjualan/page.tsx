"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Sale = {
  id: number;
  order_date: string;
  buyer_name: string;
  app_name: string;
  package_name: string;
  duration: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  profit: number;
  payment_method: string;
  order_status: string;
  notes: string;
};

type Product = {
  id: number;
  name: string;
  category: string;
  purchase_price: number;
  selling_price: number;
};

const fallbackProducts = [
  "Netflix",
  "iQIYI",
  "HBO Max",
  "WeTV",
  "Prime Video",
  "CapCut",
  "Zoom",
  "Loklok",
  "Viu",
  "Canva",
  "ChatGPT",
  "Meitu",
  "Grammarly",
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const emptyForm = {
  order_date: new Date().toISOString().split("T")[0],
  buyer_name: "",
  app_name: "",
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
  const [form, setForm] = useState(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // FILTER TANGGAL
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function getSales() {
    const { data, error } = await supabase
      .from("sales")
      .select(
        "id, order_date, buyer_name, app_name, package_name, duration, quantity, purchase_price, selling_price, profit, payment_method, order_status, notes"
      )
      .order("id", { ascending: false });

    if (error) {
      alert("Gagal mengambil data penjualan: " + error.message);
      return;
    }

    setSales((data || []) as Sale[]);
  }

  async function getProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, category, purchase_price, selling_price"
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Gagal mengambil produk:", error.message);
      return;
    }

    setProducts((data || []) as Product[]);
  }

  async function loadData() {
    setLoading(true);

    await Promise.all([
      getSales(),
      getProducts(),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const productOptions =
    products.length > 0
      ? products
      : fallbackProducts.map((name, index) => ({
          id: index,
          name,
          category: "",
          purchase_price: 0,
          selling_price: 0,
        }));

  // FILTER DATA
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        sale.buyer_name?.toLowerCase().includes(keyword) ||
        sale.app_name?.toLowerCase().includes(keyword) ||
        sale.package_name?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All" ||
        sale.order_status === statusFilter;

      const matchesStartDate =
        !startDate || sale.order_date >= startDate;

      const matchesEndDate =
        !endDate || sale.order_date <= endDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    sales,
    search,
    statusFilter,
    startDate,
    endDate,
  ]);

  const totalOmzet = filteredSales.reduce(
    (total, sale) =>
      total +
      Number(sale.selling_price || 0) *
        Number(sale.quantity || 0),
    0
  );

  const totalProfit = filteredSales.reduce(
    (total, sale) =>
      total + Number(sale.profit || 0),
    0
  );

  // EXPORT CSV
  function exportCSV() {
    if (filteredSales.length === 0) {
      alert("Tidak ada data yang bisa diexport.");
      return;
    }

    const headers = [
      "Tanggal",
      "Buyer",
      "Aplikasi",
      "Paket",
      "Durasi",
      "Qty",
      "Harga Modal",
      "Harga Jual",
      "Total Jual",
      "Profit",
      "Metode Pembayaran",
      "Status",
      "Catatan",
    ];

    const rows = filteredSales.map((sale) => [
      sale.order_date || "",
      sale.buyer_name || "",
      sale.app_name || "",
      sale.package_name || "",
      sale.duration || "",
      sale.quantity || 0,
      sale.purchase_price || 0,
      sale.selling_price || 0,
      Number(sale.selling_price || 0) *
        Number(sale.quantity || 0),
      sale.profit || 0,
      sale.payment_method || "",
      sale.order_status || "",
      sale.notes || "",
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");

            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\ufeff" + csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const dateLabel =
      startDate || endDate
        ? `${startDate || "awal"}_sampai_${endDate || "sekarang"}`
        : new Date()
            .toISOString()
            .split("T")[0];

    link.href = url;
    link.download = `rekapan_penjualan_${dateLabel}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("All");
    setStartDate("");
    setEndDate("");
  }

  function openAddForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      order_date: new Date()
        .toISOString()
        .split("T")[0],
    });
    setShowForm(true);
  }

  function openEditForm(sale: Sale) {
    setEditingId(sale.id);

    setForm({
      order_date:
        sale.order_date ||
        new Date()
          .toISOString()
          .split("T")[0],
      buyer_name: sale.buyer_name || "",
      app_name: sale.app_name || "",
      package_name: sale.package_name || "",
      duration: sale.duration || "",
      quantity: String(sale.quantity || 1),
      purchase_price: String(
        sale.purchase_price ?? ""
      ),
      selling_price: String(
        sale.selling_price ?? ""
      ),
      payment_method:
        sale.payment_method || "QRIS",
      order_status:
        sale.order_status || "Completed",
      notes: sale.notes || "",
    });

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({
      ...emptyForm,
      order_date: new Date()
        .toISOString()
        .split("T")[0],
    });
  }

  function handleProductChange(
    productName: string
  ) {
    const selectedProduct = products.find(
      (product) =>
        product.name === productName
    );

    setForm((currentForm) => ({
      ...currentForm,
      app_name: productName,

      purchase_price: selectedProduct
        ? String(
            selectedProduct.purchase_price ?? 0
          )
        : "",

      selling_price: selectedProduct
        ? String(
            selectedProduct.selling_price ?? 0
          )
        : "",
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.buyer_name.trim()) {
      alert("Nama buyer wajib diisi.");
      return;
    }

    if (!form.app_name) {
      alert("Pilih aplikasi terlebih dahulu.");
      return;
    }

    if (!form.package_name.trim()) {
      alert("Nama paket wajib diisi.");
      return;
    }

    if (
      form.purchase_price === "" ||
      form.selling_price === ""
    ) {
      alert(
        "Harga modal dan harga jual wajib diisi."
      );
      return;
    }

    const purchasePrice = Number(
      form.purchase_price
    );

    const sellingPrice = Number(
      form.selling_price
    );

    const quantity =
      Number(form.quantity) || 1;

    if (
      isNaN(purchasePrice) ||
      purchasePrice < 0
    ) {
      alert("Harga modal tidak valid.");
      return;
    }

    if (
      isNaN(sellingPrice) ||
      sellingPrice < 0
    ) {
      alert("Harga jual tidak valid.");
      return;
    }

    if (quantity < 1) {
      alert("Quantity minimal 1.");
      return;
    }

    setSaving(true);

    const saleData = {
      order_date: form.order_date,
      buyer_name: form.buyer_name.trim(),
      app_name: form.app_name,
      package_name:
        form.package_name.trim(),
      duration: form.duration.trim(),
      quantity,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      payment_method:
        form.payment_method,
      order_status:
        form.order_status,
      notes: form.notes.trim(),
    };

    let error;

    if (editingId) {
      const response = await supabase
        .from("sales")
        .update(saleData)
        .eq("id", editingId);

      error = response.error;
    } else {
      const response = await supabase
        .from("sales")
        .insert([saleData]);

      error = response.error;
    }

    if (error) {
      alert(
        "Gagal menyimpan: " +
          error.message
      );
    } else {
      alert(
        editingId
          ? "Data penjualan berhasil diperbarui ♡"
          : "Order berhasil ditambahkan ♡"
      );

      closeForm();
      await getSales();
    }

    setSaving(false);
  }

  async function deleteSale(sale: Sale) {
    const confirmed = confirm(
      `Hapus order ${sale.buyer_name} - ${sale.app_name}?`
    );

    if (!confirmed) return;

    const {
      data: warrantyData,
      error: warrantyCheckError,
    } = await supabase
      .from("warranties")
      .select("id")
      .eq("sale_id", sale.id);

    if (warrantyCheckError) {
      alert(
        "Tidak bisa mengecek garansi terkait: " +
          warrantyCheckError.message
      );
      return;
    }

    if (
      warrantyData &&
      warrantyData.length > 0
    ) {
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
      alert(
        "Gagal menghapus: " +
          error.message
      );
      return;
    }

    alert("Order berhasil dihapus.");
    await getSales();
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />

          <p className="text-sm text-gray-400">
            Loading penjualan...
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
            manage your orders ♡
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-800">
            Penjualan
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Rekap semua transaksi muviee.idd.
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
          <p className="text-xs text-gray-400">
            Total Order
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-800">
            {filteredSales.length}
          </p>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">
            Total Omzet
          </p>

          <p className="mt-2 text-xl font-bold text-pink-500">
            {formatRupiah(totalOmzet)}
          </p>
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">
            Total Profit
          </p>

          <p className="mt-2 text-xl font-bold text-green-600">
            {formatRupiah(totalProfit)}
          </p>
        </div>
      </div>

      {/* FILTER */}
      <div className="mb-6 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Cari buyer, aplikasi, atau paket..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-400"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-400"
          >
            <option value="All">
              Semua Status
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Cancelled">
              Cancelled
            </option>

            <option value="Refunded">
              Refunded
            </option>
          </select>

          <div>
            <label className="mb-1 block text-[11px] text-gray-400">
              Dari tanggal
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-400">
              Sampai tanggal
            </label>

            <input
              type="date"
              value={endDate}
              min={
                startDate || undefined
              }
              onChange={(e) =>
                setEndDate(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={resetFilters}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
          >
            Reset Filter
          </button>

          <button
            onClick={exportCSV}
            className="rounded-xl bg-green-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-600"
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
        <div className="border-b border-pink-100 px-6 py-5">
          <h2 className="font-semibold text-gray-800">
            Data Penjualan
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            {filteredSales.length} data ditemukan
          </p>
        </div>

        {filteredSales.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-4xl">
              🛒
            </div>

            <p className="mt-3 font-medium text-gray-600">
              Belum ada data
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Tambahkan order pertama kamu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-4 text-xs text-gray-400">
                    Tanggal
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Buyer
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Aplikasi
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Paket
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Qty
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Modal
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Harga Jual
                  </th>

                  <th className="px-4 py-4 text-xs text-gray-400">
                    Profit
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
                {filteredSales.map(
                  (sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-pink-50/30"
                    >
                      <td className="px-6 py-4 text-gray-500">
                        {sale.order_date
                          ? new Date(
                              `${sale.order_date}T00:00:00`
                            ).toLocaleDateString(
                              "id-ID"
                            )
                          : "-"}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-700">
                          {sale.buyer_name}
                        </p>

                        {sale.notes && (
                          <p className="mt-1 max-w-[150px] truncate text-[10px] text-gray-400">
                            {sale.notes}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 font-medium text-gray-700">
                        {sale.app_name}
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-gray-600">
                          {sale.package_name}
                        </p>

                        <p className="text-[10px] text-gray-400">
                          {sale.duration}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {sale.quantity}
                      </td>

                      <td className="px-4 py-4 text-gray-500">
                        {formatRupiah(
                          Number(
                            sale.purchase_price ||
                              0
                          )
                        )}
                      </td>

                      <td className="px-4 py-4 font-medium text-gray-700">
                        {formatRupiah(
                          Number(
                            sale.selling_price ||
                              0
                          )
                        )}
                      </td>

                      <td className="px-4 py-4 font-semibold text-green-600">
                        {formatRupiah(
                          Number(
                            sale.profit || 0
                          )
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-medium ${
                            sale.order_status ===
                            "Completed"
                              ? "bg-green-50 text-green-600"
                              : sale.order_status ===
                                "Cancelled"
                              ? "bg-red-50 text-red-500"
                              : "bg-yellow-50 text-yellow-600"
                          }`}
                        >
                          {sale.order_status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              openEditForm(
                                sale
                              )
                            }
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-500 hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteSale(
                                sale
                              )
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-100"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-pink-100 bg-white px-6 py-5">
              <div>
                <h2 className="font-semibold text-gray-800">
                  {editingId
                    ? "Edit Order"
                    : "Tambah Order"}
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Isi informasi transaksi di bawah.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="rounded-lg px-3 py-2 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {/* Tanggal + Buyer */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Tanggal Order
                  </label>

                  <input
                    type="date"
                    value={form.order_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        order_date:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Nama Buyer
                  </label>

                  <input
                    type="text"
                    value={form.buyer_name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        buyer_name:
                          e.target.value,
                      })
                    }
                    placeholder="contoh: Aulia"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
                    required
                  />
                </div>
              </div>

              {/* App + Package */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Aplikasi
                  </label>

                  <select
                    value={form.app_name}
                    onChange={(e) =>
                      handleProductChange(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-400"
                    required
                  >
                    <option value="">
                      Pilih aplikasi
                    </option>

                    {productOptions.map(
                      (product) => (
                        <option
                          key={`${product.id}-${product.name}`}
                          value={product.name}
                        >
                          {product.name}
                        </option>
                      )
                    )}
                  </select>

                  {products.length > 0 &&
                    form.app_name && (
                      <p className="mt-2 text-[11px] text-pink-400">
                        Harga otomatis diambil
                        dari data Produk ♡
                      </p>
                    )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Nama Paket
                  </label>

                  <input
                    type="text"
                    value={form.package_name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        package_name:
                          e.target.value,
                      })
                    }
                    placeholder="contoh: Private Standard"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
                    required
                  />
                </div>
              </div>

              {/* Duration + Quantity */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Durasi
                  </label>

                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration:
                          e.target.value,
                      })
                    }
                    placeholder="contoh: 1 Bulan"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        quantity:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
                    required
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Harga Modal / Firsthand
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      Rp
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.purchase_price
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          purchase_price:
                            e.target.value,
                        })
                      }
                      placeholder="15000"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-11 text-sm outline-none focus:border-pink-400"
                      required
                    />
                  </div>

                  {form.app_name &&
                    products.length > 0 && (
                      <p className="mt-1 text-[10px] text-gray-400">
                        Bisa diubah manual untuk
                        order tertentu.
                      </p>
                    )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Harga Jual
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      Rp
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.selling_price
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          selling_price:
                            e.target.value,
                        })
                      }
                      placeholder="35000"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-11 text-sm outline-none focus:border-pink-400"
                      required
                    />
                  </div>

                  {form.app_name &&
                    products.length > 0 && (
                      <p className="mt-1 text-[10px] text-gray-400">
                        Bisa diubah manual untuk
                        order tertentu.
                      </p>
                    )}
                </div>
              </div>

              {/* Payment + Status */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Metode Pembayaran
                  </label>

                  <select
                    value={
                      form.payment_method
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        payment_method:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-400"
                  >
                    <option>QRIS</option>
                    <option>GoPay</option>
                    <option>DANA</option>
                    <option>OVO</option>
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Status Order
                  </label>

                  <select
                    value={
                      form.order_status
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        order_status:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-400"
                  >
                    <option>
                      Completed
                    </option>

                    <option>
                      Pending
                    </option>

                    <option>
                      Cancelled
                    </option>

                    <option>
                      Refunded
                    </option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Catatan
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes:
                        e.target.value,
                    })
                  }
                  placeholder="Catatan order..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
                />
              </div>

              {/* Profit Preview */}
              {form.purchase_price !== "" &&
                form.selling_price !== "" && (
                  <div className="rounded-xl bg-green-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">
                          Estimasi profit
                        </p>

                        <p className="mt-1 text-lg font-bold text-green-600">
                          {formatRupiah(
                            (Number(
                              form.selling_price
                            ) -
                              Number(
                                form.purchase_price
                              )) *
                              Number(
                                form.quantity ||
                                  1
                              )
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-gray-400">
                          Per item
                        </p>

                        <p className="mt-1 text-xs font-semibold text-green-600">
                          {formatRupiah(
                            Number(
                              form.selling_price
                            ) -
                              Number(
                                form.purchase_price
                              )
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                  className="flex-1 rounded-xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
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
    </div>
  );
}