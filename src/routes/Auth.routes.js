import { Router } from "express";
import { Validater } from "../helper/Validator.js";
import { AuthValidation } from "../validation/Auth.validation.js";
import { CreateUser } from "../controllers/User.controller.js";


const router = Router();

router.route("/register").post(Validater(AuthValidation),CreateUser)


export default router;