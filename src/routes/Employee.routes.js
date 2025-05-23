import { Router } from "express";
import { CreateEmployeeDetail, UpdateEmployeeDetail, DeleteEmployeeDetail, ListEmployeesWithPagination } from "../controllers/Employee.controller.js";
import { upload } from "../config/multer.config.js";
import { Autherization } from "../middleware/Autherization.js";
import { Validater } from "../helper/Validator.js";
import { EmployeeValidation } from "../validation/Employee.validation.js";

const routes = Router();

routes.route("/add-data").post(Autherization, upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    { name: "pancard", maxCount: 1 },
    { name: "Bank_Proof", maxCount: 1 },
    { name: "Voter_Id", maxCount: 1 },
    { name: "Driving_Licance", maxCount: 1 },
]), Validater(EmployeeValidation), CreateEmployeeDetail)

routes.route("/employee/:id").put(Autherization, upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    { name: "pancard", maxCount: 1 },
    { name: "Bank_Proof", maxCount: 1 },
    { name: "Voter_Id", maxCount: 1 },
    { name: "Driving_Licance", maxCount: 1 },
]), Validater(EmployeeValidation), UpdateEmployeeDetail);

routes.route("/employee/:id").delete(Autherization, DeleteEmployeeDetail);
routes.route("/employees").get(Autherization, ListEmployeesWithPagination);


export default routes;




