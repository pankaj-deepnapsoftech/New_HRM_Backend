
import express from "express";
import {
  addEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
  addAssetToEmployee  
} from "../controllers/EmpDataController.js";
import {upload} from "../config/multer.config.js"; 

const router = express.Router();
router.post("/", upload.fields([
  { name: "addhar" },
  { name: "pan" },
  { name: "voterCard" },
  { name: "driving" },
  { name: "bankProof" }
]), addEmployee);

router.put("/:id", upload.fields([
  { name: "addhar" },
  { name: "pan" },
  { name: "voterCard" },
  { name: "driving" },
  { name: "bankProof" }
]), updateEmployee);


router.post("/", addEmployee);
router.get("/", getAllEmployees);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

router.put("/:id/add-asset", addAssetToEmployee);

export default router;
