import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { listShifts, createShift, updateShift } from '../controllers/shift.controller';
import { listPlans, createPlan, updatePlan } from '../controllers/plan.controller';
import { listSeats, bulkCreateSeats, updateSeatStatus } from '../controllers/seat.controller';
import { getDashboardStats } from '../controllers/dashboard.controller';

export const shiftsRouter = Router();
shiftsRouter.use(authenticate);
shiftsRouter.get('/', listShifts);
shiftsRouter.post('/', createShift);
shiftsRouter.put('/:id', updateShift);

export const plansRouter = Router();
plansRouter.use(authenticate);
plansRouter.get('/', listPlans);
plansRouter.post('/', createPlan);
plansRouter.put('/:id', updatePlan);

export const seatsRouter = Router();
seatsRouter.use(authenticate);
seatsRouter.get('/', listSeats);
seatsRouter.post('/bulk', bulkCreateSeats);
seatsRouter.patch('/:id/status', updateSeatStatus);

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get('/stats', getDashboardStats);
