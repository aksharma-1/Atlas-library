import { Router } from 'express';
import { getPublicSaasPlans } from '../controllers/saasPlan.controller';

export const saasPlansRouter = Router();

// Public endpoint to view SaaS pricing & billing options during onboarding/landing
saasPlansRouter.get('/', getPublicSaasPlans);
