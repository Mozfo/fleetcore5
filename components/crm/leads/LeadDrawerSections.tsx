/**
 * LeadDrawerSections - Section components for Lead Drawer
 *
 * Contains:
 * - DrawerSection (wrapper)
 * - InfoRow (reusable row)
 * - ScoreBar (animated progress bar)
 * - ContactSection, CompanySection, ScoringSection, AssignmentSection, GdprSection, MessageSection
 */

"use client";

import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  Building2,
  BarChart3,
  User,
  Shield,
  MessageSquare,
  Copy,
  ExternalLink,
  Linkedin,
  MapPin,
  Megaphone,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select-native";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  drawerSectionVariants,
  scoreBarVariants,
} from "@/lib/animations/drawer-variants";
import { useFleetSizeOptions } from "@/lib/hooks/useFleetSizeOptions";
import type { Lead } from "@/types/crm";
import type { LucideIcon } from "lucide-react";
import { LeadTimeline } from "./LeadTimeline";

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

interface DrawerSectionProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  visible?: boolean;
}

export function DrawerSection({
  icon: Icon,
  title,
  children,
  visible = true,
}: DrawerSectionProps) {
  if (!visible) return null;

  return (
    <motion.div variants={drawerSectionVariants} className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        {children}
      </div>
      <Separator className="mt-4" />
    </motion.div>
  );
}

interface InfoRowProps {
  label: string;
  value: string | null | undefined;
  actions?: Array<{
    icon: LucideIcon;
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  emptyText?: string;
}

export function InfoRow({
  label,
  value,
  actions,
  emptyText = "—",
}: InfoRowProps) {
  const displayValue = value || emptyText;
  const isEmpty = !value;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p
          className={cn(
            "truncate text-sm font-medium",
            isEmpty && "text-muted-foreground italic"
          )}
        >
          {displayValue}
        </p>
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-1">
          {actions.map((action, i) => {
            const ActionIcon = action.icon;
            if (action.href) {
              return (
                <Button
                  key={i}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                  asChild
                >
                  <a href={action.href} title={action.label}>
                    <ActionIcon className="h-4 w-4" />
                  </a>
                </Button>
              );
            }
            return (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                className="h-7 w-7 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                onClick={action.onClick}
                title={action.label}
              >
                <ActionIcon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  value: number | null;
  max: number;
  color: "blue" | "green" | "orange";
}

export function ScoreBar({ label, value, max, color }: ScoreBarProps) {
  const percentage = value !== null ? Math.min((value / max) * 100, 100) : 0;
  const displayValue = value !== null ? value : "—";

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {displayValue}
          {value !== null && `/${max}`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <motion.div
          className={cn("h-full rounded-full", colorClasses[color])}
          variants={scoreBarVariants}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// EDITABLE INFO ROW (F1-B)
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface EditableInfoRowProps {
  label: string;
  field: string;
  value: string | number | null | undefined;
  editedValue?: string | number | null;
  isEditing: boolean;
  onChange: (field: string, value: string | null) => void;
  type?:
    | "text"
    | "email"
    | "tel"
    | "url"
    | "textarea"
    | "select"
    | "datetime-local";
  options?: SelectOption[];
  placeholder?: string;
  emptyText?: string;
}

export function EditableInfoRow({
  label,
  field,
  value,
  editedValue,
  isEditing,
  onChange,
  type = "text",
  options,
  placeholder,
  emptyText = "—",
}: EditableInfoRowProps) {
  // Use edited value if available, otherwise original value
  const currentValue = editedValue !== undefined ? editedValue : value;
  const displayValue = currentValue?.toString() || emptyText;
  const isEmpty = !currentValue;

  // Read mode
  if (!isEditing) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs">{label}</p>
          <p
            className={cn(
              "truncate text-sm font-medium",
              isEmpty && "text-muted-foreground italic"
            )}
          >
            {displayValue}
          </p>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {type === "select" && options ? (
        <Select
          value={currentValue?.toString() || ""}
          onChange={(e) => onChange(field, e.target.value || null)}
          className="h-9"
        >
          <option value="">{placeholder || "Select..."}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      ) : type === "textarea" ? (
        <Textarea
          value={currentValue?.toString() || ""}
          onChange={(e) => onChange(field, e.target.value || null)}
          placeholder={placeholder}
          rows={3}
          className="resize-none"
        />
      ) : (
        <Input
          type={type}
          value={currentValue?.toString() || ""}
          onChange={(e) => onChange(field, e.target.value || null)}
          placeholder={placeholder}
          className="h-9"
        />
      )}
    </div>
  );
}

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

interface SectionProps {
  lead: Lead;
}

// Editable section props (F1-B)
interface EditableSectionProps extends SectionProps {
  isEditing?: boolean;
  editedLead?: Partial<Lead>;
  onFieldChange?: (field: string, value: string | null) => void;
  owners?: Array<{ id: string; first_name: string; last_name: string | null }>;
}

export function ContactSection({
  lead,
  isEditing = false,
  editedLead = {},
  onFieldChange = () => {},
}: EditableSectionProps) {
  const { t } = useTranslation("crm");

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} ${t("leads.drawer.actions.copied")}`);
    } catch {
      toast.error(t("leads.drawer.actions.copy_failed"));
    }
  };

  const email = lead.email;
  const phone = lead.phone;

  // In edit mode, show editable fields
  if (isEditing) {
    return (
      <DrawerSection icon={Mail} title={t("leads.drawer.sections.contact")}>
        <EditableInfoRow
          label={t("leads.modal.first_name")}
          field="first_name"
          value={lead.first_name}
          editedValue={editedLead.first_name}
          isEditing={isEditing}
          onChange={onFieldChange}
          type="text"
        />
        <EditableInfoRow
          label={t("leads.modal.last_name")}
          field="last_name"
          value={lead.last_name}
          editedValue={editedLead.last_name}
          isEditing={isEditing}
          onChange={onFieldChange}
          type="text"
        />
        <EditableInfoRow
          label={t("leads.drawer.fields.email")}
          field="email"
          value={email}
          editedValue={editedLead.email}
          isEditing={isEditing}
          onChange={onFieldChange}
          type="email"
        />
        <EditableInfoRow
          label={t("leads.drawer.fields.phone")}
          field="phone"
          value={phone}
          editedValue={editedLead.phone}
          isEditing={isEditing}
          onChange={onFieldChange}
          type="tel"
        />
      </DrawerSection>
    );
  }

  // Read mode
  return (
    <DrawerSection icon={Mail} title={t("leads.drawer.sections.contact")}>
      <InfoRow
        label={t("leads.drawer.fields.email")}
        value={email}
        actions={
          email
            ? [
                {
                  icon: Copy,
                  label: t("leads.drawer.actions.copy"),
                  onClick: () => handleCopy(email, "Email"),
                },
                {
                  icon: Mail,
                  label: t("leads.drawer.actions.send"),
                  href: `mailto:${email}`,
                },
              ]
            : undefined
        }
      />
      <InfoRow
        label={t("leads.drawer.fields.phone")}
        value={phone}
        actions={
          phone
            ? [
                {
                  icon: Copy,
                  label: t("leads.drawer.actions.copy"),
                  onClick: () => handleCopy(phone, "Phone"),
                },
                {
                  icon: Phone,
                  label: t("leads.drawer.actions.call"),
                  href: `tel:${phone}`,
                },
              ]
            : undefined
        }
      />
    </DrawerSection>
  );
}

export function CompanySection({
  lead,
  isEditing = false,
  editedLead = {},
  onFieldChange = () => {},
}: EditableSectionProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";

  // Dynamic fleet size options from CRM settings
  const { options: fleetSizeOptions, getLabel: getFleetSizeLabel } =
    useFleetSizeOptions();

  // Map to SelectOption format
  const fleetSizeSelectOptions: SelectOption[] = fleetSizeOptions.map(
    (opt) => ({
      value: opt.value,
      label: getFleetSizeLabel(opt.value, locale),
    })
  );

  // In edit mode, show editable fields
  if (isEditing) {
    return (
      <DrawerSection
        icon={Building2}
        title={t("leads.drawer.sections.company")}
      >
        <EditableInfoRow
          label={t("leads.drawer.fields.company_name")}
          field="company_name"
          value={lead.company_name}
          editedValue={editedLead.company_name}
          isEditing={isEditing}
          onChange={onFieldChange}
          type="text"
        />
        <EditableInfoRow
          label={t("leads.drawer.fields.fleet_size")}
          field="fleet_size"
          value={lead.fleet_size}
          editedValue={editedLead.fleet_size}
          isEditing={isEditing}
          onChange={onFieldChange}
          type="select"
          options={fleetSizeSelectOptions}
          placeholder={t("leads.modal.select_fleet_size")}
        />
        <EditableInfoRow
          label={t("leads.drawer.fields.current_software")}
          field="current_software"
          value={lead.current_software}
          editedValue={editedLead.current_software}
          isEditing={isEditing}
          onChange={onFieldChange}
          type="text"
          placeholder={t("leads.modal.current_software_placeholder")}
        />
        <EditableInfoRow
          label={t("leads.drawer.fields.website")}
          field="website_url"
          value={lead.website_url}
          editedValue={editedLead.website_url}
          isEditing={isEditing}
          onChange={onFieldChange}
          type="url"
          placeholder="https://example.com"
        />
      </DrawerSection>
    );
  }

  // Read mode
  return (
    <DrawerSection icon={Building2} title={t("leads.drawer.sections.company")}>
      <InfoRow
        label={t("leads.drawer.fields.company_name")}
        value={lead.company_name}
      />
      {lead.industry && (
        <InfoRow
          label={t("leads.drawer.fields.industry")}
          value={lead.industry}
        />
      )}
      {lead.company_size && (
        <InfoRow
          label={t("leads.drawer.fields.company_size")}
          value={`${lead.company_size} ${t("leads.drawer.fields.employees")}`}
        />
      )}
      <InfoRow
        label={t("leads.drawer.fields.fleet_size")}
        value={lead.fleet_size}
        emptyText={t("leads.drawer.empty.not_provided")}
      />
      {lead.current_software && (
        <InfoRow
          label={t("leads.drawer.fields.current_software")}
          value={lead.current_software}
        />
      )}
      {lead.website_url && (
        <InfoRow
          label={t("leads.drawer.fields.website")}
          value={lead.website_url}
          actions={[
            {
              icon: ExternalLink,
              label: t("leads.drawer.actions.open"),
              href: lead.website_url.startsWith("http")
                ? lead.website_url
                : `https://${lead.website_url}`,
            },
          ]}
        />
      )}
      {lead.linkedin_url && (
        <InfoRow
          label={t("leads.drawer.fields.linkedin")}
          value={lead.linkedin_url}
          actions={[
            {
              icon: Linkedin,
              label: t("leads.drawer.actions.open"),
              href: lead.linkedin_url.startsWith("http")
                ? lead.linkedin_url
                : `https://${lead.linkedin_url}`,
            },
          ]}
        />
      )}
    </DrawerSection>
  );
}

export function LocationSection({ lead }: SectionProps) {
  const { t } = useTranslation("crm");

  // Only show if we have location info beyond country
  if (!lead.city && !lead.country) return null;

  return (
    <DrawerSection icon={MapPin} title={t("leads.drawer.sections.location")}>
      {lead.country && (
        <InfoRow
          label={t("leads.drawer.fields.country")}
          value={`${lead.country.flag_emoji} ${lead.country.country_name_en}`}
        />
      )}
      {lead.city && (
        <InfoRow label={t("leads.drawer.fields.city")} value={lead.city} />
      )}
    </DrawerSection>
  );
}

export function SourceSection({ lead }: SectionProps) {
  const { t } = useTranslation("crm");

  // Only show if we have source/UTM info
  if (
    !lead.source &&
    !lead.utm_source &&
    !lead.utm_medium &&
    !lead.utm_campaign
  )
    return null;

  return (
    <DrawerSection icon={Megaphone} title={t("leads.drawer.sections.source")}>
      {lead.source && (
        <InfoRow label={t("leads.drawer.fields.source")} value={lead.source} />
      )}
      {lead.utm_source && (
        <InfoRow
          label={t("leads.drawer.fields.utm_source")}
          value={lead.utm_source}
        />
      )}
      {lead.utm_medium && (
        <InfoRow
          label={t("leads.drawer.fields.utm_medium")}
          value={lead.utm_medium}
        />
      )}
      {lead.utm_campaign && (
        <InfoRow
          label={t("leads.drawer.fields.utm_campaign")}
          value={lead.utm_campaign}
        />
      )}
    </DrawerSection>
  );
}

export function NotesSection({ lead }: SectionProps) {
  const { t } = useTranslation("crm");

  if (!lead.qualification_notes) return null;

  return (
    <DrawerSection icon={FileText} title={t("leads.drawer.sections.notes")}>
      <p className="text-muted-foreground text-sm whitespace-pre-wrap">
        {lead.qualification_notes}
      </p>
    </DrawerSection>
  );
}

export function ScoringSection({ lead }: SectionProps) {
  const { t } = useTranslation("crm");

  return (
    <DrawerSection icon={BarChart3} title={t("leads.drawer.sections.scoring")}>
      <ScoreBar
        label={t("leads.drawer.fields.fit_score")}
        value={lead.fit_score}
        max={100}
        color="blue"
      />
      <ScoreBar
        label={t("leads.drawer.fields.engagement_score")}
        value={lead.engagement_score}
        max={100}
        color="orange"
      />
      <ScoreBar
        label={t("leads.drawer.fields.qualification_score")}
        value={lead.qualification_score}
        max={100}
        color="green"
      />
    </DrawerSection>
  );
}

// Priority options for the select dropdown
const PRIORITY_OPTIONS: SelectOption[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function AssignmentSection({
  lead,
  isEditing = false,
  editedLead = {},
  onFieldChange = () => {},
  owners = [],
}: EditableSectionProps) {
  const { t } = useTranslation("crm");

  const assignedName = lead.assigned_to
    ? `${lead.assigned_to.first_name} ${lead.assigned_to.last_name || ""}`.trim()
    : null;

  const formatDate = (dateValue: Date | string) => {
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format datetime-local value from Date
  const formatDateTimeLocal = (
    dateValue: Date | string | null | undefined
  ): string => {
    if (!dateValue) return "";
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    // Format: YYYY-MM-DDTHH:MM
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Create owner options for select dropdown
  const ownerOptions: SelectOption[] = owners.map((owner) => ({
    value: owner.id,
    label: `${owner.first_name} ${owner.last_name || ""}`.trim(),
  }));

  // Localized priority options
  const localizedPriorityOptions: SelectOption[] = PRIORITY_OPTIONS.map(
    (opt) => ({
      value: opt.value,
      label: t(`leads.card.priority.${opt.value}`),
    })
  );

  // In edit mode, show editable fields
  if (isEditing) {
    return (
      <DrawerSection icon={User} title={t("leads.drawer.sections.assignment")}>
        <EditableInfoRow
          label={t("leads.table.columns.priority")}
          field="priority"
          value={lead.priority}
          editedValue={editedLead.priority}
          isEditing={isEditing}
          onChange={onFieldChange}
          type="select"
          options={localizedPriorityOptions}
          placeholder={t("leads.filters.select_value")}
        />
        {ownerOptions.length > 0 && (
          <EditableInfoRow
            label={t("leads.drawer.fields.assigned_to")}
            field="assigned_to_id"
            value={lead.assigned_to?.id || null}
            editedValue={editedLead.assigned_to_id}
            isEditing={isEditing}
            onChange={onFieldChange}
            type="select"
            options={ownerOptions}
            placeholder={t("leads.drawer.empty.unassigned")}
          />
        )}
        <EditableInfoRow
          label={t("leads.drawer.fields.next_action")}
          field="next_action_date"
          value={formatDateTimeLocal(lead.next_action_date)}
          editedValue={
            editedLead.next_action_date !== undefined
              ? formatDateTimeLocal(editedLead.next_action_date)
              : undefined
          }
          isEditing={isEditing}
          onChange={onFieldChange}
          type="datetime-local"
        />
        {/* Created date is readonly */}
        <InfoRow
          label={t("leads.drawer.fields.created")}
          value={formatDate(lead.created_at)}
        />
      </DrawerSection>
    );
  }

  // Read mode
  return (
    <DrawerSection icon={User} title={t("leads.drawer.sections.assignment")}>
      {lead.priority && (
        <InfoRow
          label={t("leads.table.columns.priority")}
          value={t(`leads.card.priority.${lead.priority}`)}
        />
      )}
      <InfoRow
        label={t("leads.drawer.fields.assigned_to")}
        value={assignedName}
        emptyText={t("leads.drawer.empty.unassigned")}
      />
      {lead.next_action_date && (
        <InfoRow
          label={t("leads.drawer.fields.next_action")}
          value={formatDate(lead.next_action_date)}
        />
      )}
      <InfoRow
        label={t("leads.drawer.fields.created")}
        value={formatDate(lead.created_at)}
      />
    </DrawerSection>
  );
}

interface GdprSectionProps {
  lead: Lead;
  visible: boolean;
}

export function GdprSection({ lead, visible }: GdprSectionProps) {
  const { t } = useTranslation("crm");

  if (!visible) return null;

  const consentStatus =
    lead.gdpr_consent === true
      ? t("leads.drawer.consent_status.yes")
      : lead.gdpr_consent === false
        ? t("leads.drawer.consent_status.no")
        : t("leads.drawer.consent_status.unknown");

  const formatDateTime = (dateValue: Date | string) => {
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DrawerSection icon={Shield} title={t("leads.drawer.sections.gdpr")}>
      <InfoRow label={t("leads.drawer.fields.consent")} value={consentStatus} />
      {lead.consent_at && (
        <InfoRow
          label={t("leads.drawer.fields.consent_date")}
          value={formatDateTime(lead.consent_at)}
        />
      )}
      {lead.consent_ip && (
        <InfoRow
          label={t("leads.drawer.fields.consent_ip")}
          value={lead.consent_ip}
        />
      )}
    </DrawerSection>
  );
}

export function MessageSection({
  lead,
  isEditing = false,
  editedLead = {},
  onFieldChange = () => {},
}: EditableSectionProps) {
  const { t } = useTranslation("crm");

  // In edit mode, always show the section with editable textarea
  if (isEditing) {
    return (
      <DrawerSection
        icon={MessageSquare}
        title={t("leads.drawer.sections.message")}
      >
        <EditableInfoRow
          label={t("leads.modal.message")}
          field="message"
          value={lead.message}
          editedValue={editedLead.message}
          isEditing={isEditing}
          onChange={onFieldChange}
          type="textarea"
          placeholder={t("leads.modal.message_placeholder")}
          emptyText={t("leads.drawer.empty.no_message")}
        />
      </DrawerSection>
    );
  }

  // Read mode - only show if message exists
  if (!lead.message) return null;

  return (
    <DrawerSection
      icon={MessageSquare}
      title={t("leads.drawer.sections.message")}
    >
      <p className="text-muted-foreground text-sm whitespace-pre-wrap">
        {lead.message}
      </p>
    </DrawerSection>
  );
}

export function TimelineSection({ lead }: SectionProps) {
  const { t } = useTranslation("crm");

  return (
    <DrawerSection icon={Clock} title={t("leads.drawer.sections.timeline")}>
      <LeadTimeline
        leadId={lead.id}
        leadEmail={lead.email}
        leadPhone={lead.phone}
      />
    </DrawerSection>
  );
}
