const dateFormatter = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" });

// Returns an empty string for values that are not valid dates
export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}
