import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireActiveTenant } from '../middleware/requireActiveTenant';
import { listStudents, createStudent, getStudentProfile, updateStudent, deleteStudent } from '../controllers/student.controller';
import {
  createMembership,
  markMembershipLeft,
  vacateSeat,
  deleteMembership,
  clearAllLeftMemberships,
  addGiftDays,
  listMembershipsWithFilters,
} from '../controllers/membership.controller';
import { recordPayment, getReceipt, deletePayment } from '../controllers/payment.controller';

export const studentsRouter = Router();
studentsRouter.use(authenticate, requireActiveTenant);
studentsRouter.get('/', listStudents);
studentsRouter.post('/', createStudent);
studentsRouter.get('/:id', getStudentProfile);
studentsRouter.put('/:id', updateStudent);
studentsRouter.delete('/:id', deleteStudent);

export const membershipsRouter = Router();
membershipsRouter.use(authenticate, requireActiveTenant);
membershipsRouter.get('/', listMembershipsWithFilters);
membershipsRouter.post('/', createMembership);
membershipsRouter.delete('/clear-left', clearAllLeftMemberships);
membershipsRouter.delete('/:id', deleteMembership);
membershipsRouter.patch('/:id/vacate', vacateSeat);
membershipsRouter.patch('/:id/left', markMembershipLeft);
membershipsRouter.post('/:id/gift-days', addGiftDays);

export const paymentsRouter = Router();
paymentsRouter.use(authenticate, requireActiveTenant);
paymentsRouter.post('/', recordPayment);
paymentsRouter.get('/:id/receipt', getReceipt);
paymentsRouter.delete('/:id', deletePayment);
