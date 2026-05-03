/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments (though unlikely in AI Studio)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Formats a statistical value string (like "5000+") with standard international thousand separators.
 * Handles existing commas correctly by stripping and re-applying them.
 */
export function formatStatValue(val: string | number) {
  if (val === undefined || val === null) return "";
  const str = String(val).trim();
  if (!str) return "";

  // Strip all non-numeric characters except for the first sequence of digits
  // and keep any suffixes like "+", "%", "k", "M"
  const cleanVal = str.replace(/,/g, "");
  const match = cleanVal.match(/^(\d+)(.*)$/);

  if (match) {
    const numStr = match[1];
    const suffix = match[2];
    const num = parseInt(numStr, 10);
    
    if (isNaN(num)) return str;
    
    // Format the number part with standard separators
    return num.toLocaleString("en-US") + suffix;
  }

  return str;
}
