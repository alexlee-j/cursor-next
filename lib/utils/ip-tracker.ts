import { logger } from "./logger";

interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface TrackInfo {
  ip: string;
  userAgent: string;
  location: GeoLocation;
}

class IPTracker {
  private cache: Map<string, { location: GeoLocation; timestamp: number }>;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

  constructor() {
    this.cache = new Map();
  }

  private async fetchLocation(ip: string): Promise<GeoLocation> {
    try {
      // 使用免费的 IP 地理位置 API
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();

      if (data.status === "success") {
        return {
          country: data.country,
          region: data.regionName,
          city: data.city,
          latitude: data.lat,
          longitude: data.lon,
        };
      }

      return {};
    } catch (error) {
      logger.error("IP地理位置查询失败", {
        error: error instanceof Error ? error.message : String(error),
        ip,
      });
      return {};
    }
  }

  async getLocation(ip: string): Promise<GeoLocation> {
    // 检查缓存
    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.location;
    }

    // 获取新的位置信息
    const location = await this.fetchLocation(ip);
    
    // 更新缓存
    this.cache.set(ip, {
      location,
      timestamp: Date.now(),
    });

    return location;
  }

  private getClientIP(req: Request): string {
    // 尝试从各种头部获取真实 IP
    const headers = new Headers(req.headers);
    const forwardedFor = headers.get('x-forwarded-for');
    const realIP = headers.get('x-real-ip');
    
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      return ips[0];
    }
    
    if (realIP) {
      return realIP;
    }

    // 如果都没有，返回一个默认值
    return '127.0.0.1';
  }

  private getUserAgent(req: Request): string {
    const headers = new Headers(req.headers);
    return headers.get('user-agent') || 'Unknown';
  }

  async trackLoginAttempt(req: Request): Promise<TrackInfo> {
    const ip = this.getClientIP(req);
    const userAgent = this.getUserAgent(req);
    const location = await this.getLocation(ip);

    logger.info("登录尝试追踪", {
      ip,
      location,
      userAgent,
    });

    return {
      ip,
      userAgent,
      location,
    };
  }
}

// 创建单例实例
export const ipTracker = new IPTracker();
