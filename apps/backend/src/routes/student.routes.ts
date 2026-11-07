import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { listStudents, createStudent, getStudentProfile, updateStudent, deleteStudent } from '../controllers/student.controller';
import { createMembership, markMembershipLeft, addGiftDays, listMembershipsWithFilters } from '../controllers/membership.controller';
import { recordPayment, getReceipt } from '../controllers/payment.controller';

export const studentsRouter = Router();
studentsRouter.use(authenticate);
studentsRouter.get('/', listStudents);
studentsRouter.post('/', createStudent);
studentsRouter.get('/:id', getStudentProfile);
studentsRouter.put('/:id', updateStudent);
studentsRouter.delete('/:id', deleteStudent);

export const membershipsRouter = Router();
membershipsRouter.use(authenticate);
membershipsRouter.get('/', listMembershipsWithFilters);
membershipsRouter.post('/', createMembership);
membershipsRouter.patch('/:id/left', markMembershipLeft);
membershipsRouter.post('/:id/gift-days', addGiftDays);

export const paymentsRouter = Router();
paymentsRouter.use(authenticate);
paymentsRouter.post('/', recordPayment);
paymentsRouter.get('/:id/receipt', getReceipt);
