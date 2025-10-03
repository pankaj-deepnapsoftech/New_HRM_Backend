import express from "express";
import {
    CreateDepartment,
    GetAllDepartments,
    GetDepartmentById,
    UpdateDepartment,
    DeleteDepartment,
} from "../controllers/Department.js";

const router = express.Router();


router.post("/create", CreateDepartment);
router.get("/", GetAllDepartments);
router.get("/:id", GetDepartmentById);
router.put("/:id", UpdateDepartment);
router.delete("/:id", DeleteDepartment);

export default router;
