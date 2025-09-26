import express from "express";
import upload from "../middleware/upload.js";
import {
  requestLeave,
  updateLeaveStatus,
  getPendingRequests,
  getEmployeeLeaves,
} from "../controllers/leaveRequestController.js";

const router = express.Router();

// Employee: create request (multipart/form-data if file)
router.post("/requests", upload.single("file"), requestLeave);

// HR: list pending
router.get("/requests/pending", getPendingRequests);

// HR: approve/reject
router.patch("/requests/:requestId/status", updateLeaveStatus);

// Get employee final leaves by year    
router.get("/leaves/:employeeId/:year", getEmployeeLeaves);

export default router;
