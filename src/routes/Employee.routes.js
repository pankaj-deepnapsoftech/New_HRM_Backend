import { Router } from "express";
import { CreateEmployeeDetail } from "../controllers/Employee.controller.js";
import { upload } from "../config/multer.config.js";

const routes = Router();

routes.route("/add-data").post(upload.fields([
    {name:"aadhaar",maxCount:1},
    {name:"photo",maxCount:1},
    {name:"pancard",maxCount:1},
]),CreateEmployeeDetail)


export default routes;




