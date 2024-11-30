interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

class RateLimiter {
  private attempts: Map<string, LoginAttempt>;
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15分钟
  
  constructor() {
    this.attempts = new Map();
  }
  
  isBlocked(key: string): boolean {
    const attempt = this.attempts.get(key);
    if (!attempt) return false;
    
    // 如果在15分钟窗口期内尝试次数超过限制
    if (
      attempt.count >= this.MAX_ATTEMPTS &&
      Date.now() - attempt.firstAttempt < this.WINDOW_MS
    ) {
      return true;
    }
    
    // 如果超过窗口期，重置计数
    if (Date.now() - attempt.firstAttempt >= this.WINDOW_MS) {
      this.attempts.delete(key);
      return false;
    }
    
    return false;
  }
  
  addAttempt(key: string) {
    const now = Date.now();
    const attempt = this.attempts.get(key);
    
    if (!attempt) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return;
    }
    
    // 如果超过窗口期，重置计数
    if (now - attempt.firstAttempt >= this.WINDOW_MS) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return;
    }
    
    // 更新尝试次数
    this.attempts.set(key, {
      count: attempt.count + 1,
      firstAttempt: attempt.firstAttempt,
      lastAttempt: now
    });
  }
  
  getRemainingAttempts(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return this.MAX_ATTEMPTS;
    
    if (Date.now() - attempt.firstAttempt >= this.WINDOW_MS) {
      this.attempts.delete(key);
      return this.MAX_ATTEMPTS;
    }
    
    return Math.max(0, this.MAX_ATTEMPTS - attempt.count);
  }
  
  getTimeToReset(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    
    const timeLeft = this.WINDOW_MS - (Date.now() - attempt.firstAttempt);
    return Math.max(0, timeLeft);
  }
}

// 创建单例实例
export const rateLimiter = new RateLimiter();
