
import express from "express";
import {
  addEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
  addAssetToEmployee  
} from "../controllers/EmpDataController.js";

const router = express.Router();

router.post("/", addEmployee);
router.get("/", getAllEmployees);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

router.put("/:id/add-asset", addAssetToEmployee);

export default router;
