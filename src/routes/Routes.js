// import { Router } from "express";

// // local imports
// import UserRoutes from "./Auth.routes.js";
// import EmployeeRoutes from "./Employee.routes.js";
// import ProjectRoutes from "./ProjectRoutes.js";

// const router = Router();

// router.use("/user",UserRoutes)
// router.use("/employee",EmployeeRoutes)
// router.use("/projects", ProjectRoutes);

// export default router;

// export default router;

import { Router } from 'express';
import UserRoutes from './Auth.routes.js';
import EmployeeRoutes from './Employee.routes.js';
import ProjectRoutes from './ProjectRoutes.js';
import UsersRoutes from './UserRoutes.js';
import EmpDataRoutes from './EmpDataRoutes.js';
import DepartmentRoutes from './DepartmentsRoutes.js';
import LeaveRoutes from './leaveRoutes.js';
import TermsAndConditionsRoutes from './TermsAndConditions.routes.js';
import GatepassRoutes from './GatepassRoutes.js';
import SuperAdminRoutes from './SuperAdmin.routes.js';
import SuperAdminAuthRoutes from './SuperAdminAuth.routes.js';
import PaymentsRoutes from './Payments.routes.js';
import PayslipRoutes from './Payslip.routes.js';
import BenefitsRoutes from './Benefits.routes.js';
import AttendanceRegularizationRoutes from './AttendanceRegularizationRoutes.js';
import OtpRoutes from './Otp.routes.js';
import DesignationRoutes from './DesignationRoutes.js';
import AnnouncementRoutes from './Announcement.routes.js';
import ResignationRequestRoutes from './ResignationRequestRoutes.js';

const router = Router();
router.use('/user', UserRoutes);
router.use('/employee', EmployeeRoutes);
router.use('/projects', ProjectRoutes);
router.use('/users', UsersRoutes);
router.use('/empdata', EmpDataRoutes);
router.use('/departments', DepartmentRoutes);
router.use('/leaves', LeaveRoutes);
router.use('/terms', TermsAndConditionsRoutes);
router.use('/gatepass', GatepassRoutes);
router.use('/superadmin', SuperAdminRoutes);
router.use('/otp', OtpRoutes);
router.use('/superadmin-auth', SuperAdminAuthRoutes);
router.use('/payments', PaymentsRoutes);
router.use('/payslips', PayslipRoutes);
router.use('/benefits', BenefitsRoutes);
router.use('/attendance-regularization', AttendanceRegularizationRoutes);
router.use('/designations', DesignationRoutes);
router.use('/announcements', AnnouncementRoutes);
router.use('/resignation', ResignationRequestRoutes);
export default router;
