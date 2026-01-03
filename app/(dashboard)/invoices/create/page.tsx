import InvoiceForm from "@/components/invoice/invoice-form";

export default function CreateInvoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
        <p className="text-muted-foreground">
          Create a new invoice for a customer.
        </p>
      </div>
      <InvoiceForm />
    </div>
  );
}
