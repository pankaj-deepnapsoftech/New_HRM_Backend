import express from "express";
import {
  submitTermsAndConditions,
  getAllTermsStatus,
  getEmployeeTermsStatus,
  sendTermsReminder,
  getTermsStatistics
} from "../controllers/TermsAndConditions.controller.js";
import { Autherization } from "../middleware/Autherization.js";

const router = express.Router();

// Submit terms and conditions (for employees)
router.post("/submit/:employeeId", Autherization, submitTermsAndConditions);

// Get all employees terms status (for admin)
router.get("/status", Autherization, getAllTermsStatus);

// Get specific employee terms status
router.get("/status/:employeeId", Autherization, getEmployeeTermsStatus);

// Send reminder for terms submission
router.post("/reminder/:employeeId", Autherization, sendTermsReminder);

// Get terms statistics
router.get("/statistics", Autherization, getTermsStatistics);

export default router;
