import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  requireSuperAdmin,
  listAllTenants,
  approveTenantSubscription,
  toggleTenantStatus,
} from '../controllers/superadmin.controller';
import {
  getAllSaasPlansAdmin,
  createSaasPlan,
  updateSaasPlan,
  deleteSaasPlan,
  updatePlatformConfig,
} from '../controllers/saasPlan.controller';

export const superadminRouter = Router();

// All routes require authentication and role === 'superadmin'
superadminRouter.use(authenticate, requireSuperAdmin);

superadminRouter.get('/tenants', listAllTenants);
superadminRouter.post('/tenants/:id/approve', approveTenantSubscription);
superadminRouter.post('/tenants/:id/toggle-status', toggleTenantStatus);

// SaaS Plans & Pricing Configuration
superadminRouter.get('/saas-plans', getAllSaasPlansAdmin);
superadminRouter.post('/saas-plans', createSaasPlan);
superadminRouter.put('/saas-plans/:id', updateSaasPlan);
superadminRouter.delete('/saas-plans/:id', deleteSaasPlan);
superadminRouter.put('/platform-config', updatePlatformConfig);

