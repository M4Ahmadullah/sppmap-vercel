// Session time management utilities
export interface SessionTimeStatus {
  status: 'waiting' | 'active' | 'expired';
  sessionStart: Date;
  sessionEnd: Date;
  currentTime: Date;
  timeUntilStart?: number; // milliseconds until session starts
  timeRemaining?: number; // milliseconds remaining in session
  timeElapsed?: number; // milliseconds elapsed in session
  bufferMinutes: number;
}

export interface SessionTimeDisplay {
  status: 'waiting' | 'active' | 'expired';
  message: string;
  color: 'yellow' | 'green' | 'red';
  countdown?: string;
  progress?: number; // 0-100 percentage
}

export class SessionTimeManager {
  private static readonly BUFFER_MINUTES = 15;

  // Calculate session time status
  static calculateSessionStatus(sessionStart: string, sessionEnd: string): SessionTimeStatus {
    const now = new Date();
    const start = new Date(sessionStart);
    const end = new Date(sessionEnd);
    
    // Add buffer time
    const bufferMs = this.BUFFER_MINUTES * 60 * 1000;
    const startWithBuffer = new Date(start.getTime() - bufferMs);
    const endWithBuffer = new Date(end.getTime() + bufferMs);

    let status: 'waiting' | 'active' | 'expired';
    let timeUntilStart: number | undefined;
    let timeRemaining: number | undefined;
    let timeElapsed: number | undefined;

    if (now < startWithBuffer) {
      // Session hasn't started yet
      status = 'waiting';
      timeUntilStart = startWithBuffer.getTime() - now.getTime();
    } else if (now > endWithBuffer) {
      // Session has ended
      status = 'expired';
    } else {
      // Session is active
      status = 'active';
      timeRemaining = endWithBuffer.getTime() - now.getTime();
      timeElapsed = now.getTime() - startWithBuffer.getTime();
    }

    return {
      status,
      sessionStart: startWithBuffer,
      sessionEnd: endWithBuffer,
      currentTime: now,
      timeUntilStart,
      timeRemaining,
      timeElapsed,
      bufferMinutes: this.BUFFER_MINUTES
    };
  }

  // Generate display information for UI
  static getDisplayInfo(sessionStatus: SessionTimeStatus): SessionTimeDisplay {
    const { status, timeUntilStart, timeRemaining, timeElapsed, sessionStart, sessionEnd } = sessionStatus;
    
    const totalDuration = sessionEnd.getTime() - sessionStart.getTime();
    
    switch (status) {
      case 'waiting':
        return {
          status: 'waiting',
          message: `Session starts in ${this.formatTime(timeUntilStart!)}`,
          color: 'yellow',
          countdown: this.formatCountdown(timeUntilStart!)
        };
      
      case 'active':
        const progress = ((timeElapsed! / totalDuration) * 100);
        return {
          status: 'active',
          message: `Session Active - ${this.formatTime(timeRemaining!)} remaining`,
          color: 'green',
          countdown: this.formatCountdown(timeRemaining!),
          progress: Math.min(progress, 100)
        };
      
      case 'expired':
        return {
          status: 'expired',
          message: 'Session has ended',
          color: 'red'
        };
      
      default:
        return {
          status: 'expired',
          message: 'Unknown status',
          color: 'red'
        };
    }
  }

  // Check if user has access to maps/routes
  static hasMapAccess(sessionStatus: SessionTimeStatus): boolean {
    return sessionStatus.status === 'active';
  }

  // Format time duration in human readable format
  private static formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Format countdown for display
  private static formatCountdown(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Get session time info for API responses
  static getSessionTimeInfo(sessionStart: string, sessionEnd: string) {
    const status = this.calculateSessionStatus(sessionStart, sessionEnd);
    const display = this.getDisplayInfo(status);
    
    return {
      ...status,
      display,
      hasMapAccess: this.hasMapAccess(status)
    };
  }
}
