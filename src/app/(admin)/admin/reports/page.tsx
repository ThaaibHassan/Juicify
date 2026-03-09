import { requireAdmin } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type ReportItem = { title: string; description?: string; slug: string };

const REPORT_SECTIONS: { label: string; slug: string; items: ReportItem[] }[] = [
  {
    label: "Report",
    slug: "report",
    items: [
      { title: "Day Summary Reports", description: "Sales, Payments, Register reports for a day", slug: "day-summary" },
      { title: "Product Sales Report", description: "Sales summary by products", slug: "product-sales" },
      { title: "Period Sales Reports", description: "Various sales reports for given period", slug: "period-sales" },
      { title: "Customer Sales Report", description: "Sales by customers", slug: "customer-sales" },
      { title: "Outstanding Bills Report", description: "Unsettled sales bills (Credit Sales, Layaway Bills)", slug: "outstanding-bills" },
      { title: "Sales Void Report", description: "Reports of voided invoices", slug: "sales-void" },
      { title: "FOC Bills Report", description: "Details of all FOC bills", slug: "foc-bills" },
    ],
  },
  {
    label: "Product Report",
    slug: "product-report",
    items: [
      { title: "Product Pricing Report", description: "Report of all pricing for products (Unit Pricing, Price Levels)", slug: "product-pricing" },
    ],
  },
  {
    label: "Online Orders Report",
    slug: "online-orders-report",
    items: [
      { title: "Order Products Report", description: "Summary of products ordered online", slug: "order-products" },
    ],
  },
  {
    label: "Employee Reports",
    slug: "employee-reports",
    items: [
      { title: "Employee performance report", description: "Sales performance of employees", slug: "employee-performance" },
      { title: "Cashier Performance Report", description: "Sales performance of cashiers", slug: "cashier-performance" },
    ],
  },
  {
    label: "Payments Report",
    slug: "payments-report",
    items: [
      { title: "Payments received", description: "Report of payments received in a period by outlets", slug: "payments-received" },
    ],
  },
  {
    label: "Taxes and Fees Report",
    slug: "taxes-fees-report",
    items: [
      { title: "Tax and Fees Report", description: "Report for taxes collected and fees charged.", slug: "tax-fees" },
      { title: "MIRA Tax Report", description: "Reports required for MIRA - Maldives", slug: "mira-tax" },
    ],
  },
  {
    label: "Inventory Report",
    slug: "inventory-report",
    items: [
      { title: "Inventory Overview", description: "Inventory overview as of today", slug: "inventory-overview" },
      { title: "Inventory Changes Summary", description: "Summary of all inventory changes by type in a period", slug: "inventory-changes-summary" },
      { title: "Inventory Changes Report", description: "Report of all inventory changes for products in a given date range", slug: "inventory-changes" },
      { title: "Detailed Inventory Changes", description: "Detailed line by line changes to stock", slug: "detailed-inventory-changes" },
      { title: "Inventory Aging Report", description: "Overview of your inventory value by age", slug: "inventory-aging" },
      { title: "Location Low Stock Report", description: "Report of stocks below reorder limit at location", slug: "location-low-stock" },
      { title: "Company Low Stock Report", description: "Report of stocks below reorder limit company wide", slug: "company-low-stock" },
      { title: "Batch Expiry", description: "Report of batches expiring in given period", slug: "batch-expiry" },
      { title: "Batch Expired Stock Report", description: "Report of all items which are currently in stock and has expired", slug: "batch-expired-stock" },
      { title: "In Stock Batch Report", description: "Report of batches which are currently in stock", slug: "in-stock-batch" },
    ],
  },
  {
    label: "Transfers Report",
    slug: "transfers-report",
    items: [
      { title: "Period Transfer Requests", description: "Report of transfer requests between outlets", slug: "period-transfer-requests" },
      { title: "Period Transfer Issues", description: "All transfers issued between outlets", slug: "period-transfer-issues" },
    ],
  },
  {
    label: "Purchasing Report",
    slug: "purchasing-report",
    items: [
      { title: "Purchase Overview", description: "Overview of products purchased in period", slug: "purchase-overview" },
      { title: "Period Purchase Receive Reports", description: "Purchase receives reports for a period", slug: "period-purchase-receive" },
      { title: "Purchase Order Report", description: "Purchase orders in period", slug: "purchase-order" },
    ],
  },
  {
    label: "Loyalty Report",
    slug: "loyalty-report",
    items: [
      { title: "Loyalty Report", description: "Detailed loyalty reporting for a given period", slug: "loyalty" },
      { title: "Loyalty Enrollment Report", description: "Report of customers who has joined loyalty program in given date range", slug: "loyalty-enrollment" },
    ],
  },
  {
    label: "Expenses Report",
    slug: "expenses-report",
    items: [
      { title: "Expenses", description: "Expenses report", slug: "expenses" },
    ],
  },
];

export default async function AdminReportsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and run business reports by category.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_SECTIONS.map((section) => (
          <Card key={section.slug} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{section.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              {section.items.map((item) => (
                <div
                  key={item.slug}
                  className="flex items-start justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{item.title}</p>
                    {item.description && (
                      <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <Link
                    href={`/admin/reports/${section.slug}/${item.slug}`}
                    className="shrink-0 inline-flex items-center gap-1 text-primary text-xs font-medium hover:underline"
                  >
                    View
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
