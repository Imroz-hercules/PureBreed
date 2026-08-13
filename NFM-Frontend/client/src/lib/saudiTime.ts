export const SAUDI_TZ = "Asia/Riyadh";

/** Format API datetime strings (already Saudi from backend) for display. */
export function formatApiDateTime(
  dateString: string,
  includeSeconds = false
): string {
  if (!dateString || dateString === "N/A") return "N/A";
  try {
    const normalized = dateString.includes("T")
      ? dateString
      : dateString.replace(" ", "T");
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return dateString;

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    if (includeSeconds) {
      options.second = "2-digit";
    }
    return date.toLocaleString("en-US", options);
  } catch {
    return dateString;
  }
}

/** Convert datetime-local value to ISO UTC for API filters (Saudi browser local -> UTC). */
export function dateToApiIso(displayDate: Date | string): string {
  return new Date(displayDate).toISOString();
}

/** Current time in Saudi Arabia for default date pickers. */
export function getSaudiNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: SAUDI_TZ })
  );
}
