import { describe, it, expect, vi } from 'vitest';
import {
  extractBearerToken,
  requireRole,
  requireSubscriptionTier,
  verifyTokenPayload,
} from '../../server/auth-middleware';

describe('Sprint 14 - Authentication & RBAC Middleware Tests', () => {
  it('should extract Bearer token from authorization header correctly', () => {
    const req1 = { headers: { authorization: 'Bearer mock-jwt-token-xyz-123' } } as any;
    expect(extractBearerToken(req1)).toBe('mock-jwt-token-xyz-123');

    const req2 = { headers: {} } as any;
    expect(extractBearerToken(req2)).toBeNull();

    const req3 = { headers: { authorization: 'Basic dXNlcjpwYXNz' } } as any;
    expect(extractBearerToken(req3)).toBeNull();
  });

  it('should verify mock JWT token payload accurately', () => {
    const mockToken = 'mock-token-ADMIN-USR1002';
    const payload = verifyTokenPayload(mockToken);

    expect(payload).not.toBeNull();
    expect(payload?.uid).toBe('USR1002');
    expect(payload?.role).toBe('ADMIN');
  });

  it('should grant access to authorised role in requireRole middleware', () => {
    const middleware = requireRole(['AGENCY', 'ADMIN']);
    const req = { user: { uid: 'U1', email: 'admin@gov.th', role: 'ADMIN' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject access with 403 Forbidden for unauthorized role', () => {
    const middleware = requireRole(['ADMIN']);
    const req = { user: { uid: 'U2', email: 'candidate@gov.th', role: 'USER' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
      })
    );
  });

  it('should enforce Subscription Tier gating correctly', () => {
    const tierMiddleware = requireSubscriptionTier(['PREMIUM', 'ENTERPRISE'], 'Unlimited AI Matching');

    const allowedReq = { userTier: 'PREMIUM' } as any;
    const allowedRes = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const allowedNext = vi.fn();

    tierMiddleware(allowedReq, allowedRes, allowedNext);
    expect(allowedNext).toHaveBeenCalled();

    const blockedReq = { userTier: 'FREE' } as any;
    const blockedRes = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const blockedNext = vi.fn();

    tierMiddleware(blockedReq, blockedRes, blockedNext);
    expect(blockedNext).not.toHaveBeenCalled();
    expect(blockedRes.status).toHaveBeenCalledWith(403);
    expect(blockedRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'FEATURE_LOCKED_PREMIUM_REQUIRED' }),
      })
    );
  });
});
