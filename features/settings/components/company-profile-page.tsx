"use client";

import {
  Building2,
  Globe,
  ImageIcon,
  Mail,
  Pencil,
  Scale,
  Save,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { CompanyProfileData } from "../types/company-profile.types";
import { LEGAL_FIELDS_BY_COUNTRY } from "../types/company-profile.types";

interface CountryOption {
  country_code: string;
  country_name_en: string;
  flag_emoji: string;
}

function FieldValue({ value }: { value: string }) {
  return (
    <p className="text-foreground truncate py-2 text-sm">{value || "\u2014"}</p>
  );
}

export function CompanyProfilePage() {
  const [profile, setProfile] = React.useState<CompanyProfileData | null>(null);
  const [countryCode, setCountryCode] = React.useState("");
  const [countries, setCountries] = React.useState<CountryOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [snapshot, setSnapshot] = React.useState<{
    profile: CompanyProfileData;
    countryCode: string;
  } | null>(null);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [profileRes, countriesRes] = await Promise.all([
          fetch("/api/admin/settings/company-profile"),
          fetch("/api/admin/countries"),
        ]);
        if (!profileRes.ok) throw new Error("Failed to load profile");
        const profileData = await profileRes.json();
        setProfile(profileData.profile);
        setCountryCode(profileData.countryCode);

        if (countriesRes.ok) {
          const countriesData = await countriesRes.json();
          setCountries(countriesData.data ?? []);
        }
      } catch {
        toast.error("Failed to load company profile");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  function handleEdit() {
    if (profile) {
      setSnapshot({ profile: structuredClone(profile), countryCode });
    }
    setIsEditing(true);
  }

  function handleCancel() {
    if (snapshot) {
      setProfile(snapshot.profile);
      setCountryCode(snapshot.countryCode);
    }
    setSnapshot(null);
    setIsEditing(false);
  }

  async function handleSave() {
    if (!profile) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings/company-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, countryCode }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Failed to save");
        return;
      }
      toast.success("Company profile saved");
      setSnapshot(null);
      setIsEditing(false);
    } catch {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  }

  function updateIdentity(
    key: keyof CompanyProfileData["identity"],
    value: string
  ) {
    setProfile((prev) =>
      prev ? { ...prev, identity: { ...prev.identity, [key]: value } } : prev
    );
  }

  function updateAddress(
    key: keyof CompanyProfileData["address"],
    value: string
  ) {
    setProfile((prev) =>
      prev ? { ...prev, address: { ...prev.address, [key]: value } } : prev
    );
  }

  function updateLegal(key: string, value: string) {
    setProfile((prev) =>
      prev ? { ...prev, legal: { ...prev.legal, [key]: value } } : prev
    );
  }

  function updateContacts(
    key: keyof CompanyProfileData["contacts"],
    value: string
  ) {
    setProfile((prev) =>
      prev ? { ...prev, contacts: { ...prev.contacts, [key]: value } } : prev
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-24 items-center justify-center">
        <p className="text-destructive text-sm">
          Failed to load company profile.
        </p>
      </div>
    );
  }

  const legalFields = LEGAL_FIELDS_BY_COUNTRY[countryCode] ?? [];
  const selectedCountry = countries.find((c) => c.country_code === countryCode);
  const countryDisplay = selectedCountry
    ? `${selectedCountry.flag_emoji} ${selectedCountry.country_name_en}`
    : countryCode || "\u2014";

  return (
    <div className="space-y-6">
      {/* Header — title + action buttons */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="mr-2 size-4" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 size-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Button>
        )}
      </div>

      {/* Logo — single line informative */}
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <ImageIcon className="size-4" />
        Logo upload available soon
      </p>

      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Identity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="legal_name">Legal Name</Label>
              {isEditing ? (
                <Input
                  id="legal_name"
                  value={profile.identity.legal_name}
                  onChange={(e) => updateIdentity("legal_name", e.target.value)}
                />
              ) : (
                <FieldValue value={profile.identity.legal_name} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade_name">Trade Name</Label>
              {isEditing ? (
                <Input
                  id="trade_name"
                  value={profile.identity.trade_name}
                  onChange={(e) => updateIdentity("trade_name", e.target.value)}
                />
              ) : (
                <FieldValue value={profile.identity.trade_name} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal_form">Legal Form</Label>
              {isEditing ? (
                <Input
                  id="legal_form"
                  placeholder="SARL, SAS, LLC..."
                  value={profile.identity.legal_form}
                  onChange={(e) => updateIdentity("legal_form", e.target.value)}
                />
              ) : (
                <FieldValue value={profile.identity.legal_form} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              {isEditing ? (
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={profile.identity.website}
                  onChange={(e) => updateIdentity("website", e.target.value)}
                />
              ) : (
                <FieldValue value={profile.identity.website} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="street">Street</Label>
              {isEditing ? (
                <Input
                  id="street"
                  value={profile.address.street}
                  onChange={(e) => updateAddress("street", e.target.value)}
                />
              ) : (
                <FieldValue value={profile.address.street} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              {isEditing ? (
                <Input
                  id="city"
                  value={profile.address.city}
                  onChange={(e) => updateAddress("city", e.target.value)}
                />
              ) : (
                <FieldValue value={profile.address.city} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              {isEditing ? (
                <Input
                  id="postal_code"
                  value={profile.address.postal_code}
                  onChange={(e) => updateAddress("postal_code", e.target.value)}
                />
              ) : (
                <FieldValue value={profile.address.postal_code} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              {isEditing ? (
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.country_code} value={c.country_code}>
                        {c.flag_emoji} {c.country_name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FieldValue value={countryDisplay} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal — Dynamic per country */}
      {legalFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="size-5" />
              Legal ({countryCode})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {legalFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  {isEditing ? (
                    <Input
                      id={field.key}
                      placeholder={field.placeholder}
                      value={profile.legal[field.key] ?? ""}
                      onChange={(e) => updateLegal(field.key, e.target.value)}
                    />
                  ) : (
                    <FieldValue value={profile.legal[field.key] ?? ""} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary_email">Primary Email</Label>
              {isEditing ? (
                <Input
                  id="primary_email"
                  type="email"
                  value={profile.contacts.primary_email}
                  onChange={(e) =>
                    updateContacts("primary_email", e.target.value)
                  }
                />
              ) : (
                <FieldValue value={profile.contacts.primary_email} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary_phone">Primary Phone</Label>
              {isEditing ? (
                <Input
                  id="primary_phone"
                  type="tel"
                  value={profile.contacts.primary_phone}
                  onChange={(e) =>
                    updateContacts("primary_phone", e.target.value)
                  }
                />
              ) : (
                <FieldValue value={profile.contacts.primary_phone} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing_email">Billing Email</Label>
              {isEditing ? (
                <Input
                  id="billing_email"
                  type="email"
                  value={profile.contacts.billing_email}
                  onChange={(e) =>
                    updateContacts("billing_email", e.target.value)
                  }
                />
              ) : (
                <FieldValue value={profile.contacts.billing_email} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
