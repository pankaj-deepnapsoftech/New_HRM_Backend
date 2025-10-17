import express from "express";
import {
    createResignationRequest,
    getResignationRequests,
    getEmployeeResignationRequests,
    updateResignationRequestStatus,
    getResignationRequestById,
    cancelResignationRequest
} from "../controllers/ResignationRequestController.js";
import { Autherization } from "../middleware/Autherization.js";
import { AdminAuthorization } from "../middleware/AdminAuthorization.js";

const router = express.Router();

// Employee routes (protected by authentication)
router.post('/create', Autherization, createResignationRequest);
router.get('/employee', Autherization, getEmployeeResignationRequests);
router.delete('/cancel/:id', Autherization, cancelResignationRequest);

// Admin routes (protected by admin authorization)
router.get('/admin', Autherization, AdminAuthorization, getResignationRequests);
router.get('/admin/:id', Autherization, AdminAuthorization, getResignationRequestById);
router.put('/admin/:id/status', Autherization, AdminAuthorization, updateResignationRequestStatus);

export default router;
