import { Router } from "express";
import { Validater } from "../helper/Validator.js";
import { AuthValidation, LoginValidation } from "../validation/Auth.validation.js";
import { CreateUser, ForgetPassword, LogedInUser, LoginUser, LogoutUser, ResetPassword, VerifyEmail, VerifyLink } from "../controllers/User.controller.js";
import { Autherization } from "../middleware/Autherization.js";


const router = Router();

router.route("/register").post(Validater(AuthValidation),CreateUser);
router.route("/login").post(Validater(LoginValidation),LoginUser);
router.route("/loged-in-user").get(Autherization,LogedInUser);
router.route("/logout").get(Autherization,LogoutUser);
router.route("/verify-email").get(VerifyEmail);
router.route("/forget-password").post(ForgetPassword);
router.route("/verify-link").get(VerifyLink);
router.route("/reset-password").get(ResetPassword);


export default router;