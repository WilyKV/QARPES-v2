import { prisma } from './db';
import type { Request } from 'express';

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

function anonymizeIP(ip: string): string {
  if (!ip) return '';
  
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return parts.slice(0, 4).join(':') + '::';
    }
  }
  
  return ip;
}

function truncateUserAgent(userAgent: string): string {
  if (!userAgent) return '';
  return userAgent.substring(0, 200);
}

function filterSensitiveData(metadata: any): any {
  if (!metadata || typeof metadata !== 'object') return metadata;
  
  const filtered = { ...metadata };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
  
  function recursiveFilter(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(recursiveFilter);
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          result[key] = '[FILTERED]';
        } else {
          result[key] = recursiveFilter(value);
        }
      }
      return result;
    }
    
    return obj;
  }
  
  return recursiveFilter(filtered);
}

export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        metadata: data.metadata ? filterSensitiveData(data.metadata) : null,
        ipAddress: data.ipAddress ? anonymizeIP(data.ipAddress) : null,
        userAgent: data.userAgent ? truncateUserAgent(data.userAgent) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export function getRequestInfo(req: Request): { ipAddress?: string; userAgent?: string; userId?: string } {
  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
  const userAgent = req.headers['user-agent'];
  const userId = (req.session as any)?.user?.id;
  
  return {
    ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    userAgent,
    userId,
  };
}

export async function cleanupOldLogs(): Promise<void> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: ninetyDaysAgo,
        },
      },
    });
    
    console.log(`Cleaned up ${result.count} old audit logs`);
  } catch (error) {
    console.error('Failed to cleanup old audit logs:', error);
  }
}

setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);