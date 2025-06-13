// src/routes/EmpDataRoutes.js
import express from "express";
import { addEmployee, getAllEmployees, updateEmployee, deleteEmployee } from "../controllers/EmpDataController.js";

const router = express.Router();

router.post("/", addEmployee);
router.get("/", getAllEmployees);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;

