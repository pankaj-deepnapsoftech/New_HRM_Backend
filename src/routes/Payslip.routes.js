import express from 'express';
import { Autherization } from '../middleware/Autherization.js';
import { AdminAuthorization } from '../middleware/AdminAuthorization.js';
import { downloadPayslip } from '../controllers/Payslip.controller.js';

const router = express.Router();

// Download payslip PDF for a single employee (by EmpData _id)
router.get('/:id/download', Autherization, AdminAuthorization, downloadPayslip);

export default router;
