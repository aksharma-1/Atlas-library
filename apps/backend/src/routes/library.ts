import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireActiveTenant } from '../middleware/requireActiveTenant';
import { listShifts, createShift, updateShift, deleteShift } from '../controllers/shift.controller';
import { listPlans, createPlan, updatePlan, deletePlan } from '../controllers/plan.controller';
import {
  listSeats,
  bulkCreateSeats,
  updateSeatStatus,
  changeSeat,
  createSingleSeat,
  updateSeat,
  deleteSeat,
  deleteSeatsBySection,
} from '../controllers/seat.controller';
import { getDashboardStats, getRevenueStats } from '../controllers/dashboard.controller';

export const shiftsRouter = Router();
shiftsRouter.use(authenticate, requireActiveTenant);
shiftsRouter.get('/', listShifts);
shiftsRouter.post('/', createShift);
shiftsRouter.put('/:id', updateShift);
shiftsRouter.delete('/:id', deleteShift);

export const plansRouter = Router();
plansRouter.use(authenticate, requireActiveTenant);
plansRouter.get('/', listPlans);
plansRouter.post('/', createPlan);
plansRouter.put('/:id', updatePlan);
plansRouter.delete('/:id', deletePlan);

export const seatsRouter = Router();
seatsRouter.use(authenticate, requireActiveTenant);
seatsRouter.get('/', listSeats);
seatsRouter.post('/', createSingleSeat);
seatsRouter.post('/bulk', bulkCreateSeats);
seatsRouter.patch('/:id/status', updateSeatStatus);
seatsRouter.put('/:id', updateSeat);
seatsRouter.delete('/:id', deleteSeat);
seatsRouter.delete('/section/bulk', deleteSeatsBySection);
seatsRouter.post('/change', changeSeat);

export const dashboardRouter = Router();
dashboardRouter.use(authenticate, requireActiveTenant);
dashboardRouter.get('/stats', getDashboardStats);
dashboardRouter.get('/revenue', getRevenueStats);
