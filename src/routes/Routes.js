import { Router } from "express";

// local imports
import UserRoutes from "./Auth.routes.js";
import EmployeeRoutes from "./Employee.routes.js";


const router = Router();

router.use("/user",UserRoutes)
router.use("/employee",EmployeeRoutes)


export default router;