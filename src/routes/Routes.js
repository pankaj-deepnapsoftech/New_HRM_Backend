import { Router } from "express";

// local imports
import UserRoutes from "./Auth.routes.js";
import EmployeeRoutes from "./Employee.routes.js";
import ProjectRoutes from "./ProjectRoutes.js";


const router = Router();

router.use("/user",UserRoutes)
router.use("/employee",EmployeeRoutes)
router.use("/projects", ProjectRoutes);


export default router;