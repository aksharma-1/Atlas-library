import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { listStudents, createStudent, getStudentProfile } from '../controllers/student.controller';
import { createMembership } from '../controllers/membership.controller';
import { recordPayment, getReceipt } from '../controllers/payment.controller';

export const studentsRouter = Router();
studentsRouter.use(authenticate);
studentsRouter.get('/', listStudents);
studentsRouter.post('/', createStudent);
studentsRouter.get('/:id', getStudentProfile);

export const membershipsRouter = Router();
membershipsRouter.use(authenticate);
membershipsRouter.post('/', createMembership);

export const paymentsRouter = Router();
paymentsRouter.use(authenticate);
paymentsRouter.post('/', recordPayment);
paymentsRouter.get('/:id/receipt', getReceipt);
