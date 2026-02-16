/**
 * Structured security event logging
 * 
 * Logs security-relevant events in JSON format for easy parsing and analysis.
 * Does NOT log sensitive data (passwords, secrets, full request bodies).
 */

interface SecurityEvent {
  type: string;
  timestamp: string;
  ip?: string;
  path?: string;
  method?: string;
  userId?: string;
  details?: Record<string, unknown>;
}

/**
 * Log a security event
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
  const logEntry: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Use console.log with JSON structure for Vercel log ingestion
  console.log(JSON.stringify({
    level: 'security',
    ...logEntry,
  }));
}

/**
 * Log failed authentication attempt
 */
export function logFailedAuth(ip: string, path: string, reason: string) {
  logSecurityEvent({
    type: 'auth_failed',
    ip,
    path,
    details: { reason },
  });
}

/**
 * Log unauthorized access attempt
 */
export function logUnauthorizedAccess(ip: string, path: string, method: string, userId?: string) {
  logSecurityEvent({
    type: 'unauthorized_access',
    ip,
    path,
    method,
    userId,
  });
}

/**
 * Log rate limit hit
 */
export function logRateLimitHit(ip: string, path: string, limit: number) {
  logSecurityEvent({
    type: 'rate_limit_hit',
    ip,
    path,
    details: { limit },
  });
}

/**
 * Log admin action
 */
export function logAdminAction(action: string, adminId: string, path: string, details?: Record<string, unknown>) {
  logSecurityEvent({
    type: 'admin_action',
    path,
    userId: adminId,
    details: {
      action,
      ...details,
    },
  });
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(ip: string, path: string, reason: string, details?: Record<string, unknown>) {
  logSecurityEvent({
    type: 'suspicious_activity',
    ip,
    path,
    details: {
      reason,
      ...details,
    },
  });
}
