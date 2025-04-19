import { DateTime, Duration } from "luxon";
import { AppError } from "middleware/errorHandler";
import { ErrorCode, ErrorType } from "constants/errorCodes";

export class DateUtils {
  /**
   * Parse a date string into a DateTime object
   * @param dateString - ISO date string
   * @returns DateTime object
   */
  static parse(dateString: string): DateTime {
    return DateTime.fromISO(dateString);
  }

  /**
   * Format a date to ISO string
   * @param date - Date object or DateTime object
   * @returns ISO string
   */
  static toISO(date: Date | DateTime): string {
    if (date instanceof Date) {
      const iso = DateTime.fromJSDate(date).toISO();
      if (!iso) throw new AppError(ErrorCode.INVALID_DATE_FORMAT);
      return iso;
    }
    const iso = date.toISO();
    if (!iso) throw new AppError(ErrorCode.INVALID_DATE_FORMAT);
    return iso;
  }

  /**
   * Format a date to a specific format
   * @param date - Date object or DateTime object
   * @param format - Format string
   * @returns Formatted date string
   */
  static format(date: Date | DateTime, format: string): string {
    if (date instanceof Date) {
      return DateTime.fromJSDate(date).toFormat(format);
    }
    return date.toFormat(format);
  }

  /**
   * Get current date in UTC
   * @returns DateTime object
   */
  static now(): DateTime {
    return DateTime.utc();
  }

  /**
   * Add duration to a date
   * @param date - Date object or DateTime object
   * @param duration - Duration object or duration string
   * @returns DateTime object
   */
  static add(date: Date | DateTime, duration: Duration | string): DateTime {
    const dt = date instanceof Date ? DateTime.fromJSDate(date) : date;
    const dur =
      typeof duration === "string" ? Duration.fromISO(duration) : duration;
    return dt.plus(dur);
  }

  /**
   * Check if a date is valid
   * @param date - Date object or DateTime object
   * @returns boolean
   */
  static isValid(date: Date | DateTime): boolean {
    if (date instanceof Date) {
      return DateTime.fromJSDate(date).isValid;
    }
    return date.isValid;
  }

  /**
   * Convert date to local timezone
   * @param date - Date object or DateTime object
   * @returns DateTime object in local timezone
   */
  static toLocal(date: Date | DateTime): DateTime {
    if (date instanceof Date) {
      return DateTime.fromJSDate(date).toLocal();
    }
    return date.toLocal();
  }

  /**
   * Convert date to UTC
   * @param date - Date object or DateTime object
   * @returns DateTime object in UTC
   */
  static toUTC(date: Date | DateTime): DateTime {
    if (date instanceof Date) {
      return DateTime.fromJSDate(date).toUTC();
    }
    return date.toUTC();
  }
}
