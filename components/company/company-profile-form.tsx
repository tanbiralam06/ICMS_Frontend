"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Upload, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CompanyService } from "@/lib/services/company.service";
import { Separator } from "@/components/ui/separator";
import OfficeLocationsManager from "./office-locations-manager";

interface OfficeLocation {
  _id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

interface CompanyProfileData {
  companyName: string;
  companyId: string;
  taxId: string;
  gstin: string;
  address: string;
  signatoryName: string;
  bankName: string;
  accountHolderName: string;
  branch: string;
  bankAddress: string;
  accountNumber: string;
  ifscCode: string;
  swiftCode: string;
  termsUrl: string;
  logoBase64?: string;
  signatureBase64?: string;
  officeLocations?: OfficeLocation[];
  updatedAt?: string;
}

export default function CompanyProfileForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // New state for view/edit mode
  const [profileData, setProfileData] = useState<CompanyProfileData | null>(
    null
  );

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);
  const [existingSignature, setExistingSignature] = useState<string | null>(
    null
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CompanyProfileData>();

  const fetchProfile = async () => {
    try {
      const data = await CompanyService.getProfile();
      setProfileData(data);

      // If data exists, we are in View Mode initially
      // If empty, we might want to default to Edit Mode (handled below)
      if (data && Object.keys(data).length > 0) {
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }

      // Set form values
      Object.keys(data).forEach((key) => {
        setValue(key as any, data[key]);
      });
      if (data.logoBase64) setExistingLogo(data.logoBase64);
      if (data.signatureBase64) setExistingSignature(data.signatureBase64);
    } catch (error: any) {
      // 404 means no profile yet, so we default to Edit mode
      if (error.response?.status === 404) {
        setIsEditing(true);
      } else {
        toast.error("Failed to fetch company profile");
      }
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [setValue]);

  const onSubmit = async (data: CompanyProfileData) => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Append all text fields
      Object.keys(data).forEach((key) => {
        if ((data as any)[key]) formData.append(key, (data as any)[key]);
      });

      // Append files if selected
      const logoInput = document.getElementById(
        "logo-upload"
      ) as HTMLInputElement;
      if (logoInput?.files?.[0]) {
        formData.append("logo", logoInput.files[0]);
      }

      const signatureInput = document.getElementById(
        "signature-upload"
      ) as HTMLInputElement;
      if (signatureInput?.files?.[0]) {
        formData.append("signature", signatureInput.files[0]);
      }

      await CompanyService.upsertProfile(formData);
      toast.success("Company profile saved successfully");

      // Refresh data and switch to view mode
      await fetchProfile();
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to save profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original data and switch back to view
    if (profileData) {
      reset(profileData);
      setIsEditing(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  // Helper to render image - Base64 data URIs work directly as src
  const getImageSrc = (path: string | null | undefined) => {
    if (!path) return null;
    return path; // Base64 data URI or blob URL works directly
  };

  const renderImagePreview = (
    filePreview: string | null,
    existingUrl: string | null,
    label: string
  ) => {
    const src = filePreview || getImageSrc(existingUrl);

    return (
      <div className="mt-2">
        {src ? (
          <img
            src={src}
            alt={`${label} Preview`}
            className="h-24 w-auto object-contain border rounded p-1"
          />
        ) : (
          <div className="h-24 w-24 border border-dashed rounded flex items-center justify-center text-gray-400 text-xs">
            No {label}
          </div>
        )}
      </div>
    );
  };

  if (fetchLoading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );

  // --- VIEW MODE ---
  if (!isEditing && profileData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Company Master Data</CardTitle>
            <CardDescription>
              View your organization's billing details.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Company Name
              </h3>
              <p className="text-lg font-semibold">{profileData.companyName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Company ID (CIN)
              </h3>
              <p className="text-base">{profileData.companyId || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Address
              </h3>
              <p className="text-base whitespace-pre-wrap">
                {profileData.address}
              </p>
            </div>
            <div className="flex gap-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Logo</h3>
                {profileData.logoBase64 ? (
                  <img
                    src={profileData.logoBase64}
                    alt="Logo"
                    className="h-16 w-auto object-contain"
                  />
                ) : (
                  <span className="text-sm text-gray-400">Not uploaded</span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Authorized Signature
                </h3>
                {profileData.signatureBase64 ? (
                  <img
                    src={profileData.signatureBase64}
                    alt="Signature"
                    className="h-16 w-auto object-contain"
                  />
                ) : (
                  <span className="text-sm text-gray-400">Not uploaded</span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Tax & Legal */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              Tax & Legal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  GSTIN
                </h3>
                <p className="text-base">{profileData.gstin || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Tax ID
                </h3>
                <p className="text-base">{profileData.taxId || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Signatory Name
                </h3>
                <p className="text-base">{profileData.signatoryName || "-"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Bank Info */}
          <div>
            <h3 className="text-lg font-medium mb-3">Bank Details</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Bank Name</dt>
                <dd className="text-base">{profileData.bankName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Branch</dt>
                <dd className="text-base">{profileData.branch}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Account Holder
                </dt>
                <dd className="text-base">{profileData.accountHolderName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Account Number
                </dt>
                <dd className="text-base font-mono">
                  {profileData.accountNumber}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">IFSC Code</dt>
                <dd className="text-base">{profileData.ifscCode}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Swift Code
                </dt>
                <dd className="text-base">{profileData.swiftCode || "-"}</dd>
              </div>
            </dl>
          </div>

          <Separator />

          {/* Office Locations */}
          <OfficeLocationsManager
            locations={profileData.officeLocations || []}
            updatedAt={profileData.updatedAt}
            onSave={async (locations) => {
              await CompanyService.updateOfficeLocations(locations);
              await fetchProfile();
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // --- EDIT MODE ---
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Edit Company Profile</CardTitle>
          <CardDescription>
            Update your billing and invoice configuration.
          </CardDescription>
        </div>
        {profileData && (
          <Button onClick={handleCancel} variant="ghost" size="sm">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  {...register("companyName", { required: true })}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <Label>Company ID (CIN)</Label>
                <Input {...register("companyId")} placeholder="e.g. U73..." />
              </div>
              <div>
                <Label>Files</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">Logo</Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setLogoPreview)}
                    />
                    {renderImagePreview(logoPreview, existingLogo, "Logo")}
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">Signature</Label>
                    <Input
                      id="signature-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setSignaturePreview)}
                    />
                    {renderImagePreview(
                      signaturePreview,
                      existingSignature,
                      "Signature"
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  {...register("address", { required: true })}
                  placeholder="Registered Address"
                />
              </div>
            </div>
          </div>

          {/* Tax Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tax & Legal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>GSTIN</Label>
                <Input {...register("gstin")} placeholder="GST Number" />
              </div>
              <div>
                <Label>Tax ID</Label>
                <Input {...register("taxId")} placeholder="Tax ID" />
              </div>
              <div>
                <Label>Authorized Signatory Name</Label>
                <Input
                  {...register("signatoryName", { required: true })}
                  placeholder="Name of signer"
                />
              </div>
              <div>
                <Label>Terms URL (Optional)</Label>
                <Input {...register("termsUrl")} placeholder="https://..." />
              </div>
            </div>
          </div>

          {/* Bank Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input {...register("bankName", { required: true })} />
              </div>
              <div>
                <Label>Branch</Label>
                <Input {...register("branch", { required: true })} />
              </div>
              <div>
                <Label>Account Holder Name</Label>
                <Input {...register("accountHolderName", { required: true })} />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input {...register("accountNumber", { required: true })} />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <Input {...register("ifscCode", { required: true })} />
              </div>
              <div>
                <Label>Swift/Bank Code</Label>
                <Input {...register("swiftCode")} />
              </div>
              <div className="md:col-span-2">
                <Label>Bank Address</Label>
                <Input {...register("bankAddress")} />
              </div>
            </div>
          </div>

          {/* Office Locations */}
          <OfficeLocationsManager
            locations={profileData?.officeLocations || []}
            updatedAt={profileData?.updatedAt}
            onSave={async (locations) => {
              await CompanyService.updateOfficeLocations(locations);
              await fetchProfile();
            }}
          />

          <div className="flex justify-end pt-4 gap-4">
            {profileData && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
