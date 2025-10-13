import express from 'express';
import { SuperAdminAuthorization } from '../middleware/SuperAdminAuthorization.js';
import { Autherization } from '../middleware/Autherization.js';
import {
    getAllAdminsWithStats,
    getAllEmployeesWithDetails,
    getSuperAdminDashboard,
    assignEmployeesToAdmin
} from '../controllers/SuperAdmin.controller.js';

const router = express.Router();

// Apply authentication and super admin authorization to all routes
router.use(Autherization);
router.use(SuperAdminAuthorization);

// Super Admin Dashboard Routes
router.get('/dashboard', getSuperAdminDashboard);
router.get('/admins', getAllAdminsWithStats);
router.get('/employees', getAllEmployeesWithDetails);
router.post('/assign-employees', assignEmployeesToAdmin);

export default router;



