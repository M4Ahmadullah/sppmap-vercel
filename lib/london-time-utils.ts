// London timezone utilities
export class LondonTimeUtils {
  // Get current time in London timezone
  static getCurrentLondonTime(): Date {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/London"}));
  }

  // Convert any date to London timezone
  static toLondonTime(date: Date): Date {
    return new Date(date.toLocaleString("en-US", {timeZone: "Europe/London"}));
  }

  // Format date in London timezone
  static formatLondonTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return date.toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      ...options
    });
  }

  // Format time only in London timezone
  static formatLondonTimeOnly(date: Date): string {
    return date.toLocaleTimeString('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format date only in London timezone
  static formatLondonDateOnly(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      timeZone: 'Europe/London',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Check if a date is within a time range (London timezone)
  static isWithinTimeRange(date: Date, startTime: string, endTime: string): boolean {
    const londonDate = this.toLondonTime(date);
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return londonDate >= start && londonDate <= end;
  }

  // Get time difference in minutes between two dates (London timezone)
  static getTimeDifferenceMinutes(date1: Date, date2: Date): number {
    const londonDate1 = this.toLondonTime(date1);
    const londonDate2 = this.toLondonTime(date2);
    
    return Math.floor((londonDate2.getTime() - londonDate1.getTime()) / (1000 * 60));
  }

  // Get current London time as ISO string
  static getCurrentLondonTimeISO(): string {
    return this.getCurrentLondonTime().toISOString();
  }
}
