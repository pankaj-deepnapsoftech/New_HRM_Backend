import express from 'express';
import { Autherization } from '../middleware/Autherization.js';
import { AdminAuthorization } from '../middleware/AdminAuthorization.js';
import {
    createAttendanceRegularizationRequest,
    getPendingRegularizationRequests,
    getEmployeeRegularizationRequests,
    updateRegularizationRequestStatus,
    getRegularizationRequestById,
    deleteRegularizationRequest
} from '../controllers/AttendanceRegularizationController.js';

const router = express.Router();

// Employee routes (require authentication)
router.post('/request', Autherization, createAttendanceRegularizationRequest);
router.get('/employee/:employeeId', Autherization, getEmployeeRegularizationRequests);
router.get('/request/:requestId', Autherization, getRegularizationRequestById);
router.delete('/request/:requestId', Autherization, deleteRegularizationRequest);

// Manager/Admin routes (require admin authorization)
router.get('/pending', Autherization, AdminAuthorization, getPendingRegularizationRequests);
router.patch('/request/:requestId/status', Autherization, AdminAuthorization, updateRegularizationRequestStatus);

export default router;
