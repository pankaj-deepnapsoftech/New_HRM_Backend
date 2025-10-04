import express from "express";
import {
  createGatepassRequest,
  getAllGatepassRequests,
  getEmployeeGatepassRequests,
  updateGatepassStatus,
  getGatepassRequestById,
  deleteGatepassRequest
} from "../controllers/GatepassController.js";
import { Autherization } from "../middleware/Autherization.js";
import { AdminAuthorization } from "../middleware/AdminAuthorization.js";

const router = express.Router();

// Employee routes (require authentication)
router.post("/", Autherization, createGatepassRequest);
router.get("/employee", Autherization, getEmployeeGatepassRequests);
router.get("/employee/:id", Autherization, getGatepassRequestById);
router.delete("/employee/:id", Autherization, deleteGatepassRequest);

// Admin routes (require authentication + admin authorization)
router.get("/", Autherization, AdminAuthorization, getAllGatepassRequests);
router.put("/:id/status", Autherization, AdminAuthorization, updateGatepassStatus);
router.get("/:id", Autherization, AdminAuthorization, getGatepassRequestById);

export default router;
