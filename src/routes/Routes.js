import { Router } from "express";

// local imports
import UserRoutes from "./Auth.routes.js"


const router = Router();

router.use("/user",UserRoutes)


export default router;