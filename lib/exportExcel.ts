import * as XLSX from "xlsx";

type Sale = {
  id: number;
  order_date: string;
  buyer_name: string;
  app_name: string;
  fh?: string;
  package_name: string;
  duration?: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  profit: number;
  payment_method: string;
  order_status: string;
  account_details?: string;
  notes?: string;
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

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(date: string) {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID");
}

function styleSheet(
  worksheet: XLSX.WorkSheet,
  widths: number[]
) {
  worksheet["!cols"] = widths.map((width) => ({
    wch: width,
  }));

  worksheet["!autofilter"] = {
    ref: worksheet["!ref"] || "A1:A1",
  };
}

function addTitle(
  worksheet: XLSX.WorkSheet,
  title: string,
  period: string
) {
  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      [title],
      [`Periode: ${period}`],
      [],
    ],
    { origin: "A1" }
  );
}

export function exportMonthlyExcel({
  sales,
  warranties,
  month,
  year,
}: {
  sales: Sale[];
  warranties: Warranty[];
  month: number;
  year: number;
}) {
  const monthName = new Date(
    year,
    month - 1,
    1
  ).toLocaleDateString("id-ID", {
    month: "long",
  });

  const period = `${monthName} ${year}`;

  /*
   * =========================
   * FILTER PENJUALAN
   * =========================
   */

  const monthlySales = sales.filter((sale) => {
    if (!sale.order_date) return false;

    const date = new Date(`${sale.order_date}T00:00:00`);

    return (
      date.getMonth() + 1 === month &&
      date.getFullYear() === year
    );
  });

  /*
   * Cancelled & Refunded tidak dihitung
   * dalam omzet/profit.
   */

  const activeSales = monthlySales.filter(
    (sale) =>
      sale.order_status !== "Cancelled" &&
      sale.order_status !== "Refunded"
  );

  /*
   * =========================
   * SUMMARY
   * =========================
   */

  const totalOrder = activeSales.length;

  const totalQty = activeSales.reduce(
    (total, sale) =>
      total + Number(sale.quantity || 0),
    0
  );

  const totalModal = activeSales.reduce(
    (total, sale) =>
      total +
      Number(sale.purchase_price || 0) *
        Number(sale.quantity || 0),
    0
  );

  const totalOmzet = activeSales.reduce(
    (total, sale) =>
      total +
      Number(sale.selling_price || 0) *
        Number(sale.quantity || 0),
    0
  );

  const totalProfit = activeSales.reduce(
    (total, sale) =>
      total + Number(sale.profit || 0),
    0
  );

  const averageProfit =
    totalOrder > 0
      ? totalProfit / totalOrder
      : 0;

  /*
   * =========================
   * WORKBOOK
   * =========================
   */

  const workbook = XLSX.utils.book_new();

  /*
   * =========================
   * SHEET 1 — RINGKASAN
   * =========================
   */

  const summaryData = [
    ["REKAP PENJUALAN MUVIEE.IDD"],
    [`Periode: ${period}`],
    [],
    ["RINGKASAN PENJUALAN"],
    ["Total Order", totalOrder],
    ["Total Produk Terjual", totalQty],
    ["Total Modal", totalModal],
    ["Total Omzet", totalOmzet],
    ["Total Profit", totalProfit],
    ["Rata-rata Profit / Order", averageProfit],
    [],
    ["STATUS ORDER"],
    ["Completed", 0],
    ["On Going", 0],
    ["Pending", 0],
    ["Cancelled", 0],
    ["Refunded", 0],
  ];

  activeSales.forEach((sale) => {
    const index = summaryData.findIndex(
      (row) => row[0] === sale.order_status
    );

    if (index !== -1) {
      summaryData[index][1] =
        Number(summaryData[index][1] || 0) + 1;
    }
  });

  const summarySheet =
    XLSX.utils.aoa_to_sheet(summaryData);

  summarySheet["!cols"] = [
    { wch: 30 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    "Ringkasan"
  );

  /*
   * =========================
   * SHEET 2 — PENJUALAN
   * =========================
   */

  const salesRows = monthlySales.map((sale) => ({
    ID: sale.id,
    Tanggal: formatDate(sale.order_date),
    Buyer: sale.buyer_name,
    Aplikasi: sale.app_name,
    FH: sale.fh || "-",
    Paket: sale.package_name,
    Durasi: sale.duration || "-",
    Qty: Number(sale.quantity || 0),
    Modal: Number(sale.purchase_price || 0),
    "Harga Jual": Number(sale.selling_price || 0),
    Profit: Number(sale.profit || 0),
    Pembayaran: sale.payment_method || "-",
    Status: sale.order_status || "-",
    "Detail Akun": sale.account_details || "-",
    Catatan: sale.notes || "-",
  }));

  const salesSheet =
    XLSX.utils.json_to_sheet(salesRows);

  styleSheet(salesSheet, [
    8,
    14,
    22,
    18,
    15,
    20,
    12,
    8,
    16,
    16,
    16,
    16,
    14,
    40,
    35,
  ]);

  XLSX.utils.book_append_sheet(
    workbook,
    salesSheet,
    "Penjualan"
  );

  /*
   * =========================
   * SHEET 3 — REKAP APLIKASI
   * =========================
   */

  const appMap: Record<
    string,
    {
      order: number;
      qty: number;
      modal: number;
      omzet: number;
      profit: number;
    }
  > = {};

  activeSales.forEach((sale) => {
    const app = sale.app_name || "Lainnya";

    if (!appMap[app]) {
      appMap[app] = {
        order: 0,
        qty: 0,
        modal: 0,
        omzet: 0,
        profit: 0,
      };
    }

    appMap[app].order += 1;

    appMap[app].qty += Number(
      sale.quantity || 0
    );

    appMap[app].modal +=
      Number(sale.purchase_price || 0) *
      Number(sale.quantity || 0);

    appMap[app].omzet +=
      Number(sale.selling_price || 0) *
      Number(sale.quantity || 0);

    appMap[app].profit += Number(
      sale.profit || 0
    );
  });

  const appRows = Object.entries(appMap)
    .map(([app, data]) => ({
      Aplikasi: app,
      Order: data.order,
      Qty: data.qty,
      Modal: data.modal,
      Omzet: data.omzet,
      Profit: data.profit,
    }))
    .sort((a, b) => b.Profit - a.Profit);

  const appSheet =
    XLSX.utils.json_to_sheet(appRows);

  styleSheet(appSheet, [
    25,
    12,
    10,
    18,
    18,
    18,
  ]);

  XLSX.utils.book_append_sheet(
    workbook,
    appSheet,
    "Rekap Aplikasi"
  );

  /*
   * =========================
   * SHEET 4 — PEMBAYARAN
   * =========================
   */

  const paymentMap: Record<
    string,
    {
      order: number;
      total: number;
    }
  > = {};

  activeSales.forEach((sale) => {
    const payment =
      sale.payment_method || "Lainnya";

    if (!paymentMap[payment]) {
      paymentMap[payment] = {
        order: 0,
        total: 0,
      };
    }

    paymentMap[payment].order += 1;

    paymentMap[payment].total +=
      Number(sale.selling_price || 0) *
      Number(sale.quantity || 0);
  });

  const paymentRows = Object.entries(
    paymentMap
  )
    .map(([payment, data]) => ({
      "Metode Pembayaran": payment,
      "Jumlah Order": data.order,
      Total: data.total,
    }))
    .sort((a, b) => b.Total - a.Total);

  const paymentSheet =
    XLSX.utils.json_to_sheet(paymentRows);

  styleSheet(paymentSheet, [
    25,
    18,
    20,
  ]);

  XLSX.utils.book_append_sheet(
    workbook,
    paymentSheet,
    "Pembayaran"
  );

  /*
   * =========================
   * SHEET 5 — GARANSI
   * =========================
   */

  const monthlyWarranties = warranties.filter(
    (warranty) => {
      if (!warranty.claim_date) return false;

      const date = new Date(
        `${warranty.claim_date}T00:00:00`
      );

      return (
        date.getMonth() + 1 === month &&
        date.getFullYear() === year
      );
    }
  );

  const warrantyRows = monthlyWarranties.map(
    (warranty) => ({
      ID: warranty.id,
      "Order ID": warranty.sale_id,
      Buyer: warranty.buyer_name,
      Aplikasi: warranty.app_name,
      Paket: warranty.package_name,
      "Tanggal Claim": formatDate(
        warranty.claim_date
      ),
      Status: warranty.warranty_status,
      "Alasan Claim":
        warranty.claim_reason || "-",
      Catatan: warranty.notes || "-",
    })
  );

  const warrantySheet =
    XLSX.utils.json_to_sheet(warrantyRows);

  styleSheet(warrantySheet, [
    8,
    12,
    22,
    18,
    20,
    18,
    15,
    40,
    35,
  ]);

  XLSX.utils.book_append_sheet(
    workbook,
    warrantySheet,
    "Garansi"
  );

  /*
   * =========================
   * FORMAT ANGKA
   * =========================
   */

  function formatCurrencyColumn(
    sheet: XLSX.WorkSheet,
    column: string,
    startRow: number,
    endRow: number
  ) {
    for (
      let row = startRow;
      row <= endRow;
      row++
    ) {
      const cell = sheet[`${column}${row}`];

      if (cell && typeof cell.v === "number") {
        cell.z = `"Rp" #,##0`;
      }
    }
  }

  if (salesRows.length > 0) {
    formatCurrencyColumn(
      salesSheet,
      "I",
      2,
      salesRows.length + 1
    );

    formatCurrencyColumn(
      salesSheet,
      "J",
      2,
      salesRows.length + 1
    );

    formatCurrencyColumn(
      salesSheet,
      "K",
      2,
      salesRows.length + 1
    );
  }

  if (appRows.length > 0) {
    formatCurrencyColumn(
      appSheet,
      "D",
      2,
      appRows.length + 1
    );

    formatCurrencyColumn(
      appSheet,
      "E",
      2,
      appRows.length + 1
    );

    formatCurrencyColumn(
      appSheet,
      "F",
      2,
      appRows.length + 1
    );
  }

  if (paymentRows.length > 0) {
    formatCurrencyColumn(
      paymentSheet,
      "C",
      2,
      paymentRows.length + 1
    );
  }

  /*
   * =========================
   * FORMAT RINGKASAN
   * =========================
   */

  formatCurrencyColumn(
    summarySheet,
    "B",
    7,
    10
  );

  /*
   * =========================
   * DOWNLOAD
   * =========================
   */

  const safeMonthName = monthName
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");

  const fileName =
    `Rekap_Penjualan_${safeMonthName}_${year}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}