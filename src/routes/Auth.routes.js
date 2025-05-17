import { Router } from "express";
import { Validater } from "../helper/Validator.js";
import { AuthValidation, LoginValidation } from "../validation/Auth.validation.js";
import { CreateUser, LoginUser } from "../controllers/User.controller.js";


const router = Router();

router.route("/register").post(Validater(AuthValidation),CreateUser);
router.route("/login").post(Validater(LoginValidation),LoginUser);


export default router;