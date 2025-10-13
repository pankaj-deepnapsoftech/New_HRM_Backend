
import express from "express";
import {
  addEmployee,
  updateEmployee,
  deleteEmployee,
  addAssetToEmployee, 
  removeAssetFromEmployee,
  createEmployeeCredentials, 
  getAllEmployeesWithPagination,
  getAllEmployees,
  terminateEmployee,
  getAllTerminatedEmployees,
  deleteTerminatedEmployee,
  getAssetByEmpId,
  markLoginAttendance,
  markLogoutAttendance,
  getDailyAttendance,
  getMonthlyAttendance,
  getYearlyAttendance,
  getEmployeeMonthlyAttendanceById
} from "../controllers/EmpDataController.js";
import {upload} from "../config/multer.config.js";
import { Autherization } from "../middleware/Autherization.js";
import { AdminAuthorization } from "../middleware/AdminAuthorization.js"; 
const router = express.Router();

// Termination endpoints
router.get('/terminated', Autherization, AdminAuthorization, getAllTerminatedEmployees);
router.delete('/terminated/:id', Autherization, AdminAuthorization, deleteTerminatedEmployee);
router.post('/:id/terminate', Autherization, AdminAuthorization, terminateEmployee);

// Employee create and paginated list
router.post(
  '/',
  Autherization,
  AdminAuthorization,
  upload.fields([
    { name: 'addhar' },
    { name: 'pan' },
    { name: 'voterCard' },
    { name: 'driving' },
    { name: 'bankProof' },
  ]),
  addEmployee
);
router.get('/', Autherization, AdminAuthorization, getAllEmployeesWithPagination);
// Secure list-all; scope handled in controller via CurrentUser
router.get('/all', Autherization, AdminAuthorization, getAllEmployees);
router.get('/:id', Autherization, getAssetByEmpId)
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

router.put("/:id/add-asset", Autherization, AdminAuthorization, addAssetToEmployee);
router.put("/:id/remove-asset", Autherization, AdminAuthorization, removeAssetFromEmployee);
router.put("/:id/create-credentials", Autherization, AdminAuthorization, createEmployeeCredentials);

// Attendance routes
router.post("/:employeeId/attendance/login", Autherization, markLoginAttendance);
router.post("/:employeeId/attendance/logout", Autherization, markLogoutAttendance);
router.get("/attendance/daily", Autherization, AdminAuthorization, getDailyAttendance);
router.get("/attendance/monthly", Autherization, AdminAuthorization, getMonthlyAttendance);
router.get("/attendance/yearly", Autherization, AdminAuthorization, getYearlyAttendance);
router.get('/attendance/employee/:employeeId/monthly', getEmployeeMonthlyAttendanceById);

export default router;
