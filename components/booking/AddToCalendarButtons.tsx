/**
 * AddToCalendarButtons Component
 *
 * V6.2.2 - Generate "Add to Calendar" links for Google, Apple, and Outlook
 *
 * @module components/booking/AddToCalendarButtons
 */

"use client";

import { Calendar } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

interface AddToCalendarButtonsProps {
  event: CalendarEvent;
  className?: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHmmssZ)
 */
function formatGoogleDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Format date for ICS file (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Generate Google Calendar URL
 */
function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(event.startTime)}/${formatGoogleDate(event.endTime)}`,
    details: event.description,
    ...(event.location && { location: event.location }),
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL (Office 365 web)
 */
function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const baseUrl = "https://outlook.office.com/calendar/0/deeplink/compose";
  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.startTime.toISOString(),
    enddt: event.endTime.toISOString(),
    body: event.description,
    ...(event.location && { location: event.location }),
    path: "/calendar/action/compose",
    rru: "addevent",
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate ICS file content for Apple Calendar / other calendar apps
 */
function generateICSContent(event: CalendarEvent): string {
  const uid = `${Date.now()}@fleetcore.io`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FleetCore//Demo Booking//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTART:${formatICSDate(event.startTime)}
DTEND:${formatICSDate(event.endTime)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, "\\n")}
${event.location ? `LOCATION:${event.location}` : ""}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

/**
 * Download ICS file
 */
function downloadICSFile(event: CalendarEvent): void {
  const content = generateICSContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "fleetcore-demo.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AddToCalendarButtons({
  event,
  className = "",
}: AddToCalendarButtonsProps) {
  const handleGoogleCalendar = () => {
    window.open(generateGoogleCalendarUrl(event), "_blank");
  };

  const handleOutlookCalendar = () => {
    window.open(generateOutlookCalendarUrl(event), "_blank");
  };

  const handleAppleCalendar = () => {
    downloadICSFile(event);
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 ${className}`}
    >
      {/* Google Calendar */}
      <button
        type="button"
        onClick={handleGoogleCalendar}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-300 transition-all ring-inset hover:bg-gray-50 hover:shadow dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:hover:bg-slate-600"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </button>

      {/* Apple Calendar */}
      <button
        type="button"
        onClick={handleAppleCalendar}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-300 transition-all ring-inset hover:bg-gray-50 hover:shadow dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:hover:bg-slate-600"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        Apple
      </button>

      {/* Outlook Calendar */}
      <button
        type="button"
        onClick={handleOutlookCalendar}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-300 transition-all ring-inset hover:bg-gray-50 hover:shadow dark:bg-slate-700 dark:text-white dark:ring-slate-600 dark:hover:bg-slate-600"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#0078D4"
            d="M24 7.387v10.478c0 .23-.08.424-.238.576-.159.152-.352.228-.578.228h-8.057v-6.698l1.027 1.027a.393.393 0 0 0 .577 0 .393.393 0 0 0 0-.576l-1.894-1.894a.393.393 0 0 0-.577 0l-1.894 1.894a.393.393 0 0 0 0 .576.393.393 0 0 0 .577 0l1.027-1.027v6.698H7.5V5.331h7.369v2.844c0 .23.076.424.228.582.152.159.346.238.576.238h2.827v2.392h-3.373v.789H18.5v.789h-3.373v.789H18.5v.789h-3.373v.789H18.5v.789h-3.373V17h3.373v-.789H18.5v.789h5.5V7.387zm-9 6.113V5.331L21.5 5.331v2.056h-2.827c-.23 0-.424.08-.582.238-.159.159-.238.352-.238.582v5.293H15z"
          />
          <path
            fill="#0078D4"
            d="M0 7.387v10.478c0 .23.08.424.238.576.159.152.352.228.578.228H9V5.331H.816c-.226 0-.42.076-.578.228A.783.783 0 0 0 0 6.135v1.252z"
          />
        </svg>
        Outlook
      </button>

      {/* ICS Download (Generic) */}
      <button
        type="button"
        onClick={handleAppleCalendar}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-600 hover:shadow"
      >
        <Calendar className="h-4 w-4" />
        Download .ics
      </button>
    </div>
  );
}

export default AddToCalendarButtons;
