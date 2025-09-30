
import express from "express";
import {
  addEmployee,
  updateEmployee,
  deleteEmployee,
  addAssetToEmployee, 
  removeAssetFromEmployee,
  createEmployeeCredentials, 
  getAllEmployeesWithPagination,
  getAllEmployees
} from "../controllers/EmpDataController.js";
import {upload} from "../config/multer.config.js";
import { Autherization } from "../middleware/Autherization.js";
import { AdminAuthorization } from "../middleware/AdminAuthorization.js"; 

const router = express.Router();
router.post("/", Autherization, AdminAuthorization, upload.fields([
  { name: "addhar" },
  { name: "pan" },
  { name: "voterCard" },
  { name: "driving" },
  { name: "bankProof" }
]), addEmployee);
router.get("/", Autherization, AdminAuthorization, getAllEmployeesWithPagination);
router.get('/all', getAllEmployees);

router.put("/:id", Autherization, AdminAuthorization, upload.fields([
  { name: "addhar" },
  { name: "pan" },
  { name: "voterCard" },
  { name: "driving" },
  { name: "bankProof" }
]), updateEmployee);
router.delete("/:id", Autherization, AdminAuthorization, deleteEmployee);

router.put("/:id/add-asset", Autherization, AdminAuthorization, addAssetToEmployee);
router.put("/:id/remove-asset", Autherization, AdminAuthorization, removeAssetFromEmployee);
router.put("/:id/create-credentials", Autherization, AdminAuthorization, createEmployeeCredentials);

export default router;
