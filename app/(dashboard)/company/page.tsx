import CompanyProfileForm from "@/components/company/company-profile-form";

export default function CompanyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Company Profile</h2>
        <p className="text-muted-foreground">
          Manage your company's master data for invoices and billing.
        </p>
      </div>
      <CompanyProfileForm />
    </div>
  );
}
