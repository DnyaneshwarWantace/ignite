import { clsx, type ClassValue } from "clsx";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { debounce } from "lodash";
const moment = require("moment");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const useDebouncedFunction = (callback: any, delay: number) => {
  return useMemo(() => {
    return debounce(callback, delay);
  }, [callback, delay]);
};

export function timeDifferenceFromNow(inputDate: Date) {
  // Create a moment object from the input date
  const givenDate = moment(inputDate);

  // Check if the input is a valid date
  if (!givenDate.isValid()) {
    return "Invalid date";
  }

  // Get the current time
  const now = moment();

  // Calculate the difference in various units
  const diffInSeconds = now.diff(givenDate, "seconds");
  const diffInMinutes = now.diff(givenDate, "minutes");
  const diffInHours = now.diff(givenDate, "hours");
  const diffInDays = now.diff(givenDate, "days");
  const diffInWeeks = now.diff(givenDate, "weeks");
  const diffInMonths = now.diff(givenDate, "months");
  const diffInYears = now.diff(givenDate, "years");

  // Determine the appropriate unit to return
  if (diffInSeconds < 60) {
    return `${diffInSeconds}sec`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}min`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths}months`;
  } else {
    return `${diffInYears}year${diffInYears > 1 ? "s" : ""}`;
  }
}
