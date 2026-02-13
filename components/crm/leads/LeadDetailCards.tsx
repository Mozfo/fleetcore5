/**
 * LeadDetailCards - Card-based layout for lead detail view
 * Uses existing section components from LeadDrawerSections
 * Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
 */

"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { useFleetSizeOptions } from "@/lib/hooks/useFleetSizeOptions";
import {
  Mail,
  Building2,
  BarChart3,
  User,
  Shield,
  MessageSquare,
  MapPin,
  Megaphone,
  FileText,
  Copy,
  Phone,
  ExternalLink,
  Linkedin,
  Clock,
} from "lucide-react";
import { LeadTimeline } from "./LeadTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select-native";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/crm";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { ScoreGauge } from "./ScoreGauge";
import type { LucideIcon } from "lucide-react";

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface LeadDetailCardsProps {
  lead: Lead;
  isEditing: boolean;
  editedLead: Partial<Lead>;
  onFieldChange: (field: string, value: string | null) => void;
  owners: Array<{ id: string; first_name: string; last_name: string | null }>;
}

interface CardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}

function Card({ icon: Icon, title, children, className }: CardProps) {
  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <div className="space-y-4">{children}</div>
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

function InfoRow({ label, value, actions, emptyText = "—" }: InfoRowProps) {
  const displayValue = value || emptyText;
  const isEmpty = !value;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p
          className={cn(
            "truncate text-sm font-medium text-gray-900 dark:text-white",
            isEmpty && "text-gray-400 italic dark:text-gray-500"
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

interface EditableRowProps {
  label: string;
  field: string;
  value: string | number | null | undefined;
  editedValue?: string | number | null;
  isEditing: boolean;
  onChange: (field: string, value: string | null) => void;
  type?: "text" | "email" | "tel" | "url" | "textarea" | "select";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

function EditableRow({
  label,
  field,
  value,
  editedValue,
  isEditing,
  onChange,
  type = "text",
  options,
  placeholder,
}: EditableRowProps) {
  const currentValue = editedValue !== undefined ? editedValue : value;

  if (!isEditing) {
    return <InfoRow label={label} value={currentValue?.toString() || null} />;
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </Label>
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

// Priority options
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function LeadDetailCards({
  lead,
  isEditing,
  editedLead,
  onFieldChange,
  owners,
}: LeadDetailCardsProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";

  // Dynamic fleet size options from CRM settings
  const { options: fleetSizeOptions, getLabel: getFleetSizeLabel } =
    useFleetSizeOptions();

  // Map to options format
  const fleetSizeSelectOptions = fleetSizeOptions.map((opt) => ({
    value: opt.value,
    label: getFleetSizeLabel(opt.value, locale),
  }));

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} ${t("leads.drawer.actions.copied")}`);
    } catch {
      toast.error(t("leads.drawer.actions.copy_failed"));
    }
  };

  const formatDate = (dateValue: Date | string | null) => {
    if (!dateValue) return null;
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateValue: Date | string | null) => {
    if (!dateValue) return null;
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

  // Owner options for select
  const ownerOptions = owners.map((owner) => ({
    value: owner.id,
    label: `${owner.first_name} ${owner.last_name || ""}`.trim(),
  }));

  // Localized priority options
  const localizedPriorityOptions = PRIORITY_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(`leads.card.priority.${opt.value}`),
  }));

  // Show GDPR section only for GDPR countries
  const showGdpr =
    lead.country?.country_gdpr === true || lead.gdpr_consent !== null;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {/* Contact Card */}
      <Card icon={Mail} title={t("leads.drawer.sections.contact")}>
        {isEditing ? (
          <>
            <EditableRow
              label={t("leads.modal.first_name")}
              field="first_name"
              value={lead.first_name}
              editedValue={editedLead.first_name}
              isEditing={isEditing}
              onChange={onFieldChange}
            />
            <EditableRow
              label={t("leads.modal.last_name")}
              field="last_name"
              value={lead.last_name}
              editedValue={editedLead.last_name}
              isEditing={isEditing}
              onChange={onFieldChange}
            />
            <EditableRow
              label={t("leads.drawer.fields.email")}
              field="email"
              value={lead.email}
              editedValue={editedLead.email}
              isEditing={isEditing}
              onChange={onFieldChange}
              type="email"
            />
            <EditableRow
              label={t("leads.drawer.fields.phone")}
              field="phone"
              value={lead.phone}
              editedValue={editedLead.phone}
              isEditing={isEditing}
              onChange={onFieldChange}
              type="tel"
            />
          </>
        ) : (
          <>
            <InfoRow
              label={t("leads.drawer.fields.email")}
              value={lead.email}
              actions={
                lead.email
                  ? [
                      {
                        icon: Copy,
                        label: t("leads.drawer.actions.copy"),
                        onClick: () => handleCopy(lead.email, "Email"),
                      },
                      {
                        icon: Mail,
                        label: t("leads.drawer.actions.send"),
                        href: `mailto:${lead.email}`,
                      },
                    ]
                  : undefined
              }
            />
            <InfoRow
              label={t("leads.drawer.fields.phone")}
              value={lead.phone}
              actions={
                lead.phone
                  ? [
                      {
                        icon: Copy,
                        label: t("leads.drawer.actions.copy"),
                        onClick: () => handleCopy(lead.phone ?? "", "Phone"),
                      },
                      {
                        icon: Phone,
                        label: t("leads.drawer.actions.call"),
                        href: `tel:${lead.phone}`,
                      },
                    ]
                  : undefined
              }
            />
          </>
        )}
      </Card>

      {/* Company Card */}
      <Card icon={Building2} title={t("leads.drawer.sections.company")}>
        {isEditing ? (
          <>
            <EditableRow
              label={t("leads.drawer.fields.company_name")}
              field="company_name"
              value={lead.company_name}
              editedValue={editedLead.company_name}
              isEditing={isEditing}
              onChange={onFieldChange}
            />
            <EditableRow
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
            <EditableRow
              label={t("leads.drawer.fields.current_software")}
              field="current_software"
              value={lead.current_software}
              editedValue={editedLead.current_software}
              isEditing={isEditing}
              onChange={onFieldChange}
              placeholder={t("leads.modal.current_software_placeholder")}
            />
            <EditableRow
              label={t("leads.drawer.fields.website")}
              field="website_url"
              value={lead.website_url}
              editedValue={editedLead.website_url}
              isEditing={isEditing}
              onChange={onFieldChange}
              type="url"
              placeholder="https://example.com"
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </Card>

      {/* Scoring Card - Premium visualization with breakdowns */}
      <Card
        icon={BarChart3}
        title={t("leads.drawer.sections.scoring")}
        className="xl:col-span-2"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Left: Score Gauges */}
          <div className="flex items-center justify-center gap-4">
            <ScoreGauge
              score={lead.fit_score}
              maxScore={60}
              size="sm"
              label={t("leads.scores.fit")}
            />
            <ScoreGauge
              score={lead.engagement_score}
              maxScore={100}
              size="sm"
              label={t("leads.scores.engagement")}
            />
            <ScoreGauge
              score={lead.qualification_score}
              maxScore={100}
              size="md"
              label={t("leads.scores.qualification")}
            />
          </div>

          {/* Right: Score Breakdowns */}
          <div className="space-y-4">
            <ScoreBreakdown
              type="fit"
              score={lead.fit_score}
              lead={lead}
              showDetails
            />
            <ScoreBreakdown
              type="engagement"
              score={lead.engagement_score}
              lead={lead}
              showDetails
            />
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <ScoreBreakdown
                type="qualification"
                score={lead.qualification_score}
                lead={lead}
                showDetails
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Assignment Card */}
      <Card icon={User} title={t("leads.drawer.sections.assignment")}>
        {isEditing ? (
          <>
            <EditableRow
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
              <EditableRow
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
            <InfoRow
              label={t("leads.drawer.fields.created")}
              value={formatDate(lead.created_at)}
            />
          </>
        ) : (
          <>
            {lead.priority && (
              <InfoRow
                label={t("leads.table.columns.priority")}
                value={t(`leads.card.priority.${lead.priority}`)}
              />
            )}
            <InfoRow
              label={t("leads.drawer.fields.assigned_to")}
              value={
                lead.assigned_to
                  ? `${lead.assigned_to.first_name} ${lead.assigned_to.last_name || ""}`.trim()
                  : null
              }
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
          </>
        )}
      </Card>

      {/* Location Card - Only show if we have location info */}
      {(lead.city || lead.country) && (
        <Card icon={MapPin} title={t("leads.drawer.sections.location")}>
          {lead.country && (
            <InfoRow
              label={t("leads.drawer.fields.country")}
              value={`${lead.country.flag_emoji} ${lead.country.country_name_en}`}
            />
          )}
          {lead.city && (
            <InfoRow label={t("leads.drawer.fields.city")} value={lead.city} />
          )}
        </Card>
      )}

      {/* Source Card - Only show if we have source/UTM info */}
      {(lead.source ||
        lead.utm_source ||
        lead.utm_medium ||
        lead.utm_campaign) && (
        <Card icon={Megaphone} title={t("leads.drawer.sections.source")}>
          {lead.source && (
            <InfoRow
              label={t("leads.drawer.fields.source")}
              value={lead.source}
            />
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
        </Card>
      )}

      {/* GDPR Card - Only show for GDPR countries or if consent info exists */}
      {showGdpr && (
        <Card icon={Shield} title={t("leads.drawer.sections.gdpr")}>
          <InfoRow
            label={t("leads.drawer.fields.consent")}
            value={
              lead.gdpr_consent === true
                ? t("leads.drawer.consent_status.yes")
                : lead.gdpr_consent === false
                  ? t("leads.drawer.consent_status.no")
                  : t("leads.drawer.consent_status.unknown")
            }
          />
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
        </Card>
      )}

      {/* Message Card */}
      <Card
        icon={MessageSquare}
        title={t("leads.drawer.sections.message")}
        className="md:col-span-2 xl:col-span-1"
      >
        {isEditing ? (
          <EditableRow
            label={t("leads.modal.message")}
            field="message"
            value={lead.message}
            editedValue={editedLead.message}
            isEditing={isEditing}
            onChange={onFieldChange}
            type="textarea"
            placeholder={t("leads.modal.message_placeholder")}
          />
        ) : lead.message ? (
          <p className="text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-300">
            {lead.message}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic dark:text-gray-500">
            {t("leads.drawer.empty.no_message")}
          </p>
        )}
      </Card>

      {/* Notes Card - Only show if we have notes */}
      {lead.qualification_notes && (
        <Card
          icon={FileText}
          title={t("leads.drawer.sections.notes")}
          className="md:col-span-2 xl:col-span-2 2xl:col-span-2"
        >
          <p className="text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-300">
            {lead.qualification_notes}
          </p>
        </Card>
      )}

      {/* Timeline Card */}
      <Card
        icon={Clock}
        title={t("leads.drawer.sections.timeline")}
        className="md:col-span-2 xl:col-span-3 2xl:col-span-4"
      >
        <LeadTimeline
          leadId={lead.id}
          leadEmail={lead.email}
          leadPhone={lead.phone}
        />
      </Card>
    </div>
  );
}
