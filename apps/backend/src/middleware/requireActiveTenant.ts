import type { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/Tenant';

/**
 * Middleware: requireActiveTenant
 *
 * Ensures that the authenticated user belongs to an active, approved tenant.
 * Super-admins bypass this check.
 * If tenant is inactive (suspended) -> 403 Forbidden
 * If tenant subscription is not active (pending_payment, pending_approval, expired) -> 402 Payment Required
 */
export async function requireActiveTenant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = req.user;

  // If not authenticated, let route authentication handle or fail
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Superadmins have no tenant and can manage the platform freely
  if (user.role === 'superadmin') {
    next();
    return;
  }

  if (!user.tenantId) {
    res.status(403).json({ error: 'No associated library found' });
    return;
  }

  try {
    const tenant = await Tenant.findById(user.tenantId).select('isActive subscriptionStatus');
    if (!tenant) {
      res.status(404).json({ error: 'Library not found' });
      return;
    }

    if (tenant.isActive === false) {
      res.status(403).json({
        error: 'Your library account has been suspended by the platform administrator. Please contact support.',
        code: 'TENANT_SUSPENDED',
      });
      return;
    }

    if (tenant.subscriptionStatus !== 'active') {
      res.status(402).json({
        error: 'Active subscription required. Your subscription is currently ' + tenant.subscriptionStatus,
        code: 'SUBSCRIPTION_REQUIRED',
        status: tenant.subscriptionStatus,
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
