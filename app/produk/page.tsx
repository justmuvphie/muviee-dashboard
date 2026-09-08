"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  category: string;
  purchase_price: number;
  selling_price: number;
  created_at?: string;
};

const emptyForm = {
  name: "",
  category: "Streaming",
  purchase_price: "",
  selling_price: "",
};

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function getProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, category, purchase_price, selling_price, created_at"
      )
      .order("id", { ascending: true });

    if (error) {
      alert("Gagal mengambil produk: " + error.message);
      return;
    }

    setProducts((data || []) as Product[]);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      await getProducts();
      setLoading(false);
    }

    load();
  }, []);

  const filteredProducts = products.filter((product) => {
    const keyword = search.toLowerCase();

    return (
      product.name?.toLowerCase().includes(keyword) ||
      product.category?.toLowerCase().includes(keyword)
    );
  });

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      category: product.category || "Streaming",
      purchase_price: String(product.purchase_price ?? 0),
      selling_price: String(product.selling_price ?? 0),
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

    if (!form.name.trim()) {
      alert("Nama produk wajib diisi.");
      return;
    }

    const purchasePrice = Number(form.purchase_price);
    const sellingPrice = Number(form.selling_price);

    if (isNaN(purchasePrice) || purchasePrice < 0) {
      alert("Harga modal tidak valid.");
      return;
    }

    if (isNaN(sellingPrice) || sellingPrice < 0) {
      alert("Harga jual tidak valid.");
      return;
    }

    setSaving(true);

    const productData = {
      name: form.name.trim(),
      category: form.category,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
    };

    let error;

    if (editingId) {
      const response = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingId);

      error = response.error;
    } else {
      const response = await supabase
        .from("products")
        .insert([productData]);

      error = response.error;
    }

    if (error) {
      alert("Gagal menyimpan produk: " + error.message);
    } else {
      alert(
        editingId
          ? "Produk berhasil diperbarui ♡"
          : "Produk berhasil ditambahkan ♡"
      );

      closeForm();
      await getProducts();
    }

    setSaving(false);
  }

  async function deleteProduct(product: Product) {
    const confirmed = confirm(
      `Hapus produk "${product.name}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      alert("Gagal menghapus produk: " + error.message);
      return;
    }

    alert("Produk berhasil dihapus.");
    await getProducts();
  }

  function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />
          <p className="text-sm text-gray-400">
            Loading produk...
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
            manage your products ♡
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-800">
            Produk
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Kelola aplikasi premium yang kamu jual.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="rounded-xl bg-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-pink-600"
        >
          + Tambah Produk
        </button>
      </div>

      {/* SUMMARY */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">
            Total Produk
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-800">
            {products.length}
          </p>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">
            Produk Ditampilkan
          </p>

          <p className="mt-2 text-2xl font-bold text-pink-500">
            {filteredProducts.length}
          </p>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">
            Kategori
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-800">
            {new Set(products.map((p) => p.category)).size}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="mb-6 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Cari produk atau kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
        />
      </div>

      {/* PRODUCTS */}
      <div className="rounded-2xl border border-pink-100 bg-white shadow-sm">
        <div className="border-b border-pink-100 px-6 py-5">
          <h2 className="font-semibold text-gray-800">
            Daftar Produk
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            Semua produk yang tersedia di database.
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-4xl">📦</div>

            <p className="mt-3 font-medium text-gray-600">
              Produk tidak ditemukan
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="group rounded-2xl border border-gray-100 p-5 transition hover:border-pink-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 text-xl">
                    📦
                  </div>

                  <span className="text-xs text-gray-300">
                    #{index + 1}
                  </span>
                </div>

                <h3 className="mt-5 font-semibold text-gray-800">
                  {product.name}
                </h3>

                <span className="mt-2 inline-block rounded-full bg-pink-50 px-3 py-1 text-[10px] font-medium text-pink-500">
                  {product.category}
                </span>

                {/* HARGA */}
                <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400">
                      Harga Modal
                    </span>

                    <span className="text-xs font-semibold text-gray-700">
                      {formatRupiah(product.purchase_price)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400">
                      Harga Jual
                    </span>

                    <span className="text-xs font-semibold text-pink-500">
                      {formatRupiah(product.selling_price)}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-gray-400">
                        Profit Default
                      </span>

                      <span className="text-xs font-semibold text-green-500">
                        {formatRupiah(
                          product.selling_price -
                            product.purchase_price
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => openEditForm(product)}
                    className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-500 hover:bg-blue-100"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteProduct(product)}
                    className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-100"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="font-semibold text-gray-800">
                  {editingId
                    ? "Edit Produk"
                    : "Tambah Produk"}
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Masukkan informasi aplikasi dan harga default.
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
              {/* NAMA */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Nama Produk
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="Contoh: Netflix"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400"
                  required
                />
              </div>

              {/* KATEGORI */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Kategori
                </label>

                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-400"
                >
                  <option>Streaming</option>
                  <option>Entertainment</option>
                  <option>Productivity</option>
                  <option>Design</option>
                  <option>Education</option>
                  <option>AI</option>
                  <option>Other</option>
                </select>
              </div>

              {/* HARGA MODAL */}
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
                    value={form.purchase_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        purchase_price: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-11 text-sm outline-none focus:border-pink-400"
                    required
                  />
                </div>
              </div>

              {/* HARGA JUAL */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Harga Jual Default
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    Rp
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={form.selling_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        selling_price: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-11 text-sm outline-none focus:border-pink-400"
                    required
                  />
                </div>
              </div>

              {/* PREVIEW PROFIT */}
              <div className="rounded-xl bg-pink-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Profit Default
                  </span>

                  <span className="font-semibold text-pink-500">
                    {formatRupiah(
                      Number(form.selling_price || 0) -
                        Number(form.purchase_price || 0)
                    )}
                  </span>
                </div>
              </div>

              {/* BUTTON */}
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
                    : "Tambah Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}