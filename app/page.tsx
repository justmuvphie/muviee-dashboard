"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Sale = {
  id: number;
  order_date: string;
  buyer_name: string;
  app_name: string;
  package_name: string;
  quantity: number;
  selling_price: number;
  profit: number;
  order_status: string;
};

type Warranty = {
  id: number;
  warranty_status: string;
};

const months = [
  { value: "0", label: "Januari" },
  { value: "1", label: "Februari" },
  { value: "2", label: "Maret" },
  { value: "3", label: "April" },
  { value: "4", label: "Mei" },
  { value: "5", label: "Juni" },
  { value: "6", label: "Juli" },
  { value: "7", label: "Agustus" },
  { value: "8", label: "September" },
  { value: "9", label: "Oktober" },
  { value: "10", label: "November" },
  { value: "11", label: "Desember" },
];

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    String(now.getMonth())
  );

  const [selectedYear, setSelectedYear] = useState(
    String(now.getFullYear())
  );

  const loadData = async () => {
    setLoading(true);

    const [{ data: salesData }, { data: warrantyData }] =
      await Promise.all([
        supabase
          .from("sales")
          .select(
            "id, order_date, buyer_name, app_name, package_name, quantity, selling_price, profit, order_status"
          )
          .order("order_date", { ascending: false }),

        supabase
          .from("warranties")
          .select("id, warranty_status"),
      ]);

    setSales((salesData as Sale[]) || []);
    setWarranties((warrantyData as Warranty[]) || []);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeSales = useMemo(() => {
    return sales.filter(
      (sale) =>
        sale.order_status !== "Cancelled" &&
        sale.order_status !== "Refunded"
    );
  }, [sales]);

  const filteredSales = useMemo(() => {
    const month = Number(selectedMonth);
    const year = Number(selectedYear);

    return activeSales.filter((sale) => {
      const date = new Date(`${sale.order_date}T00:00:00`);

      return (
        date.getMonth() === month &&
        date.getFullYear() === year
      );
    });
  }, [activeSales, selectedMonth, selectedYear]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();

    years.add(now.getFullYear());

    sales.forEach((sale) => {
      if (sale.order_date) {
        const year = new Date(
          `${sale.order_date}T00:00:00`
        ).getFullYear();

        if (!Number.isNaN(year)) {
          years.add(year);
        }
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [sales]);

  const totalOmzet = filteredSales.reduce(
    (sum, sale) =>
      sum +
      Number(sale.selling_price || 0) *
        Number(sale.quantity || 1),
    0
  );

  const totalProfit = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.profit || 0),
    0
  );

  const totalOrder = filteredSales.length;

  const activeWarranty = warranties.filter(
    (item) => item.warranty_status === "Active"
  ).length;

  const appStats = useMemo(() => {
    const map: Record<
      string,
      {
        orders: number;
        omzet: number;
        profit: number;
      }
    > = {};

    filteredSales.forEach((sale) => {
      if (!map[sale.app_name]) {
        map[sale.app_name] = {
          orders: 0,
          omzet: 0,
          profit: 0,
        };
      }

      map[sale.app_name].orders += Number(
        sale.quantity || 1
      );

      map[sale.app_name].omzet +=
        Number(sale.selling_price || 0) *
        Number(sale.quantity || 1);

      map[sale.app_name].profit += Number(
        sale.profit || 0
      );
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => b.omzet - a.omzet);
  }, [filteredSales]);

  const topApps = appStats.slice(0, 5);

  const maxOmzet = Math.max(
    ...topApps.map((item) => item.omzet),
    1
  );

  const recentOrders = activeSales.slice(0, 7);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const selectedMonthLabel =
    months.find(
      (month) => month.value === selectedMonth
    )?.label || "";

  const periodLabel = `${selectedMonthLabel} ${selectedYear}`;

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-50 text-green-500";

      case "On Going":
        return "bg-blue-50 text-blue-500";

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

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-pink-100 border-t-pink-500" />

          <p className="text-sm text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>
          <p className="text-sm font-medium text-pink-400">
            welcome back ♡
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-800">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Pantau penjualan dan profit muviee.idd.
          </p>
        </div>

        {/* Filter Bulan & Tahun */}
        <div className="flex w-full gap-2 sm:w-auto">

          <select
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(e.target.value)
            }
            className="min-w-0 flex-1 rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-pink-400 sm:w-[150px]"
          >
            {months.map((month) => (
              <option
                key={month.value}
                value={month.value}
              >
                {month.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(e.target.value)
            }
            className="min-w-0 flex-1 rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-pink-400 sm:w-[110px]"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon="💰"
          label="Total Omzet"
          value={formatRupiah(totalOmzet)}
          description={periodLabel}
        />

        <StatCard
          icon="✨"
          label="Total Profit"
          value={formatRupiah(totalProfit)}
          description={periodLabel}
        />

        <StatCard
          icon="🛍️"
          label="Total Order"
          value={totalOrder.toString()}
          description={periodLabel}
        />

        <StatCard
          icon="🛡️"
          label="Garansi Aktif"
          value={activeWarranty.toString()}
          description="Perlu diperhatikan"
        />

      </div>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Penjualan per Aplikasi */}
        <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="mb-6">
            <h2 className="font-bold text-gray-800">
              Penjualan per Aplikasi
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Aplikasi dengan omzet terbesar pada{" "}
              {periodLabel}.
            </p>
          </div>

          {topApps.length === 0 ? (
            <EmptyState text="Belum ada data penjualan." />
          ) : (
            <div className="space-y-5">

              {topApps.map((app, index) => (
                <div key={app.name}>

                  <div className="mb-2 flex items-center justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-xs font-bold text-pink-500">
                        {index + 1}
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-gray-700">
                          {app.name}
                        </p>

                        <p className="text-xs text-gray-400">
                          {app.orders} order
                        </p>

                      </div>

                    </div>

                    <p className="shrink-0 text-sm font-bold text-pink-500">
                      {formatRupiah(app.omzet)}
                    </p>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-pink-50">

                    <div
                      className="h-full rounded-full bg-pink-400 transition-all"
                      style={{
                        width: `${
                          (app.omzet / maxOmzet) * 100
                        }%`,
                      }}
                    />

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        {/* Profit */}
        <div className="rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-6 shadow-sm">

          <p className="text-sm font-medium text-pink-400">
            profit overview
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-800">
            {formatRupiah(totalProfit)}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Total profit untuk periode{" "}
            <span className="font-semibold text-pink-500">
              {periodLabel}
            </span>
            .
          </p>

          <div className="mt-8 rounded-2xl bg-white p-4 shadow-sm">

            <p className="text-xs text-gray-400">
              Rata-rata profit / order
            </p>

            <p className="mt-1 text-xl font-bold text-gray-700">
              {formatRupiah(
                totalOrder > 0
                  ? totalProfit / totalOrder
                  : 0
              )}
            </p>

          </div>

          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">

            <p className="text-xs text-gray-400">
              Profit margin
            </p>

            <p className="mt-1 text-xl font-bold text-gray-700">
              {totalOmzet > 0
                ? `${(
                    (totalProfit / totalOmzet) *
                    100
                  ).toFixed(1)}%`
                : "0%"}
            </p>

          </div>

        </div>
      </div>

      {/* App Recap */}
      <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">

        <div className="mb-5">

          <h2 className="font-bold text-gray-800">
            Rekap Aplikasi
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Performa setiap aplikasi pada {periodLabel}.
          </p>

        </div>

        {appStats.length === 0 ? (
          <EmptyState text="Belum ada data." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px]">

              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">

                  <th className="pb-3">
                    Aplikasi
                  </th>

                  <th className="pb-3">
                    Order
                  </th>

                  <th className="pb-3">
                    Omzet
                  </th>

                  <th className="pb-3">
                    Profit
                  </th>

                </tr>
              </thead>

              <tbody>

                {appStats.map((app) => (
                  <tr
                    key={app.name}
                    className="border-b border-gray-50 last:border-0"
                  >

                    <td className="py-4 font-semibold text-gray-700">
                      {app.name}
                    </td>

                    <td className="py-4 text-sm text-gray-500">
                      {app.orders}
                    </td>

                    <td className="py-4 text-sm font-medium text-gray-700">
                      {formatRupiah(app.omzet)}
                    </td>

                    <td className="py-4 text-sm font-semibold text-green-500">
                      {formatRupiah(app.profit)}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* Recent Orders */}
      <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">

        <div className="mb-5 flex items-center justify-between">

          <div>

            <h2 className="font-bold text-gray-800">
              Order Terbaru
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              7 transaksi terakhir yang masuk.
            </p>

          </div>

          <a
            href="/penjualan"
            className="rounded-xl bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-500 transition hover:bg-pink-100"
          >
            Lihat Semua
          </a>

        </div>

        {recentOrders.length === 0 ? (
          <EmptyState text="Belum ada order." />
        ) : (
          <div className="space-y-3">

            {recentOrders.map((sale) => (
              <div
                key={sale.id}
                className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >

                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100">
                    🛍️
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold text-gray-700">
                      {sale.buyer_name}
                    </p>

                    <p className="truncate text-xs text-gray-400">
                      {sale.app_name} • {sale.package_name}
                    </p>

                  </div>

                </div>

                <div className="flex items-center justify-between gap-6 sm:justify-end">

                  <div className="text-left sm:text-right">

                    <p className="text-sm font-bold text-gray-700">
                      {formatRupiah(
                        Number(sale.selling_price || 0) *
                          Number(sale.quantity || 1)
                      )}
                    </p>

                    <p className="text-xs text-gray-400">
                      {formatDate(sale.order_date)}
                    </p>

                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                      sale.order_status
                    )}`}
                  >
                    {sale.order_status}
                  </span>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: string;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-xl">
          {icon}
        </div>

      </div>

      <p className="mt-5 text-sm text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xl font-bold text-gray-800">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {description}
      </p>

    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-2xl bg-gray-50">

      <p className="text-sm text-gray-400">
        {text}
      </p>

    </div>
  );
}