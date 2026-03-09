import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportNotImplemented } from "@/components/reports/report-not-implemented";
import {
  DaySummaryReport,
  ProductSalesReport,
  PeriodSalesReport,
  CustomerSalesReport,
  OutstandingBillsReport,
  SalesVoidReport,
  FOCBillsReport,
  ProductPricingReport,
  OrderProductsReport,
  PaymentsReceivedReport,
  InventoryOverviewReport,
  LowStockReport,
  TaxFeesReport,
} from "@/components/reports/report-views";
import {
  fetchDaySummary,
  fetchProductSales,
  fetchPeriodSales,
  fetchCustomerSales,
  fetchOutstandingBills,
  fetchSalesVoid,
  fetchFOCBills,
  fetchProductPricing,
  fetchOrderProducts,
  fetchPaymentsReceived,
  fetchInventoryOverview,
  fetchLowStock,
  fetchTaxFeesReport,
} from "@/lib/reports";

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

const REPORT_CONFIG: Record<
  string,
  {
    title: string;
    description?: string;
    mode: "day" | "period" | "none";
    implemented: boolean;
  }
> = {
  "report/day-summary": {
    title: "Day Summary Reports",
    description: "Sales, Payments, Register reports for a day",
    mode: "day",
    implemented: true,
  },
  "report/product-sales": {
    title: "Product Sales Report",
    description: "Sales summary by products",
    mode: "period",
    implemented: true,
  },
  "report/period-sales": {
    title: "Period Sales Reports",
    description: "Various sales reports for given period",
    mode: "period",
    implemented: true,
  },
  "report/customer-sales": {
    title: "Customer Sales Report",
    description: "Sales by customers",
    mode: "period",
    implemented: true,
  },
  "report/outstanding-bills": {
    title: "Outstanding Bills Report",
    description: "Unsettled sales bills (Credit Sales, Layaway Bills)",
    mode: "none",
    implemented: true,
  },
  "report/sales-void": {
    title: "Sales Void Report",
    description: "Reports of voided invoices",
    mode: "none",
    implemented: true,
  },
  "report/foc-bills": {
    title: "FOC Bills Report",
    description: "Details of all FOC bills",
    mode: "none",
    implemented: true,
  },
  "product-report/product-pricing": {
    title: "Product Pricing Report",
    description: "Report of all pricing for products (Unit Pricing, Price Levels)",
    mode: "none",
    implemented: true,
  },
  "online-orders-report/order-products": {
    title: "Order Products Report",
    description: "Summary of products ordered online",
    mode: "period",
    implemented: true,
  },
  "employee-reports/employee-performance": {
    title: "Employee performance report",
    description: "Sales performance of employees",
    mode: "period",
    implemented: false,
  },
  "employee-reports/cashier-performance": {
    title: "Cashier Performance Report",
    description: "Sales performance of cashiers",
    mode: "period",
    implemented: false,
  },
  "payments-report/payments-received": {
    title: "Payments received",
    description: "Report of payments received in a period by outlets",
    mode: "period",
    implemented: true,
  },
  "taxes-fees-report/tax-fees": {
    title: "Tax and Fees Report",
    description: "Report for taxes collected and fees charged.",
    mode: "period",
    implemented: true,
  },
  "taxes-fees-report/mira-tax": {
    title: "MIRA Tax Report",
    description: "Reports required for MIRA - Maldives",
    mode: "period",
    implemented: false,
  },
  "inventory-report/inventory-overview": {
    title: "Inventory Overview",
    description: "Inventory overview as of today",
    mode: "none",
    implemented: true,
  },
  "inventory-report/inventory-changes-summary": {
    title: "Inventory Changes Summary",
    description: "Summary of all inventory changes by type in a period",
    mode: "period",
    implemented: false,
  },
  "inventory-report/inventory-changes": {
    title: "Inventory Changes Report",
    description: "Report of all inventory changes for products in a given date range",
    mode: "period",
    implemented: false,
  },
  "inventory-report/detailed-inventory-changes": {
    title: "Detailed Inventory Changes",
    description: "Detailed line by line changes to stock",
    mode: "period",
    implemented: false,
  },
  "inventory-report/inventory-aging": {
    title: "Inventory Aging Report",
    description: "Overview of your inventory value by age",
    mode: "none",
    implemented: false,
  },
  "inventory-report/location-low-stock": {
    title: "Location Low Stock Report",
    description: "Report of stocks below reorder limit at location",
    mode: "none",
    implemented: true,
  },
  "inventory-report/company-low-stock": {
    title: "Company Low Stock Report",
    description: "Report of stocks below reorder limit company wide",
    mode: "none",
    implemented: true,
  },
  "inventory-report/batch-expiry": {
    title: "Batch Expiry",
    description: "Report of batches expiring in given period",
    mode: "period",
    implemented: false,
  },
  "inventory-report/batch-expired-stock": {
    title: "Batch Expired Stock Report",
    description: "Report of all items which are currently in stock and has expired",
    mode: "none",
    implemented: false,
  },
  "inventory-report/in-stock-batch": {
    title: "In Stock Batch Report",
    description: "Report of batches which are currently in stock",
    mode: "none",
    implemented: false,
  },
  "transfers-report/period-transfer-requests": {
    title: "Period Transfer Requests",
    description: "Report of transfer requests between outlets",
    mode: "period",
    implemented: false,
  },
  "transfers-report/period-transfer-issues": {
    title: "Period Transfer Issues",
    description: "All transfers issued between outlets",
    mode: "period",
    implemented: false,
  },
  "purchasing-report/purchase-overview": {
    title: "Purchase Overview",
    description: "Overview of products purchased in period",
    mode: "period",
    implemented: false,
  },
  "purchasing-report/period-purchase-receive": {
    title: "Period Purchase Receive Reports",
    description: "Purchase receives reports for a period",
    mode: "period",
    implemented: false,
  },
  "purchasing-report/purchase-order": {
    title: "Purchase Order Report",
    description: "Purchase orders in period",
    mode: "period",
    implemented: false,
  },
  "loyalty-report/loyalty": {
    title: "Loyalty Report",
    description: "Detailed loyalty reporting for a given period",
    mode: "period",
    implemented: false,
  },
  "loyalty-report/loyalty-enrollment": {
    title: "Loyalty Enrollment Report",
    description: "Report of customers who has joined loyalty program in given date range",
    mode: "period",
    implemented: false,
  },
  "expenses-report/expenses": {
    title: "Expenses Report",
    description: "Expenses report",
    mode: "period",
    implemented: false,
  },
};

type Props = {
  params: Promise<{ section: string; report: string }>;
  searchParams: Promise<{ date?: string; from?: string; to?: string }>;
};

export default async function ReportViewPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { section, report } = await params;
  const sp = await searchParams;
  const key = `${section}/${report}`;
  const config = REPORT_CONFIG[key] ?? {
    title: slugToTitle(report),
    description: `Report: ${slugToTitle(section)} → ${slugToTitle(report)}`,
    mode: "none" as const,
    implemented: false,
  };

  const basePath = `/admin/reports/${section}/${report}`;
  const date = sp.date ?? todayISO();
  const from = sp.from ?? defaultFrom();
  const to = sp.to ?? todayISO();

  const supabase = await createSupabaseServerClient();

  if (!config.implemented) {
    return (
      <ReportLayout
        title={config.title}
        description={config.description}
        mode="none"
        searchParams={sp}
        basePath={basePath}
      >
        <ReportNotImplemented
          title={config.title}
          message="This report requires data sources or features that are not yet configured (e.g. outlets, batches, loyalty, expenses, employees)."
        />
      </ReportLayout>
    );
  }

  switch (key) {
    case "report/day-summary": {
      const data = await fetchDaySummary(supabase, date);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="day"
          searchParams={sp}
          basePath={basePath}
        >
          <DaySummaryReport data={data} />
        </ReportLayout>
      );
    }
    case "report/product-sales": {
      const data = await fetchProductSales(supabase, from, to);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="period"
          searchParams={sp}
          basePath={basePath}
        >
          <ProductSalesReport data={data} />
        </ReportLayout>
      );
    }
    case "report/period-sales": {
      const data = await fetchPeriodSales(supabase, from, to);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="period"
          searchParams={sp}
          basePath={basePath}
        >
          <PeriodSalesReport data={data} />
        </ReportLayout>
      );
    }
    case "report/customer-sales": {
      const data = await fetchCustomerSales(supabase, from, to);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="period"
          searchParams={sp}
          basePath={basePath}
        >
          <CustomerSalesReport data={data} />
        </ReportLayout>
      );
    }
    case "report/outstanding-bills": {
      const data = await fetchOutstandingBills(supabase);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="none"
          searchParams={sp}
          basePath={basePath}
        >
          <OutstandingBillsReport data={data} />
        </ReportLayout>
      );
    }
    case "report/sales-void": {
      const data = await fetchSalesVoid(supabase);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="none"
          searchParams={sp}
          basePath={basePath}
        >
          <SalesVoidReport data={data} />
        </ReportLayout>
      );
    }
    case "report/foc-bills": {
      const data = await fetchFOCBills(supabase);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="none"
          searchParams={sp}
          basePath={basePath}
        >
          <FOCBillsReport data={data} />
        </ReportLayout>
      );
    }
    case "product-report/product-pricing": {
      const data = await fetchProductPricing(supabase);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="none"
          searchParams={sp}
          basePath={basePath}
        >
          <ProductPricingReport data={data} />
        </ReportLayout>
      );
    }
    case "online-orders-report/order-products": {
      const data = await fetchOrderProducts(supabase, from, to);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="period"
          searchParams={sp}
          basePath={basePath}
        >
          <OrderProductsReport data={data} />
        </ReportLayout>
      );
    }
    case "payments-report/payments-received": {
      const data = await fetchPaymentsReceived(supabase, from, to);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="period"
          searchParams={sp}
          basePath={basePath}
        >
          <PaymentsReceivedReport data={data} />
        </ReportLayout>
      );
    }
    case "taxes-fees-report/tax-fees": {
      const data = await fetchTaxFeesReport(supabase, from, to);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="period"
          searchParams={sp}
          basePath={basePath}
        >
          <TaxFeesReport data={data} />
        </ReportLayout>
      );
    }
    case "inventory-report/inventory-overview": {
      const data = await fetchInventoryOverview(supabase);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="none"
          searchParams={sp}
          basePath={basePath}
        >
          <InventoryOverviewReport data={data} />
        </ReportLayout>
      );
    }
    case "inventory-report/location-low-stock":
    case "inventory-report/company-low-stock": {
      const data = await fetchLowStock(supabase);
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="none"
          searchParams={sp}
          basePath={basePath}
        >
          <LowStockReport data={data} />
        </ReportLayout>
      );
    }
    default:
      return (
        <ReportLayout
          title={config.title}
          description={config.description}
          mode="none"
          searchParams={sp}
          basePath={basePath}
        >
          <ReportNotImplemented title={config.title} />
        </ReportLayout>
      );
  }
}
