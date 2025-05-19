import { Router } from "express";
import { Validater } from "../helper/Validator.js";
import { AuthValidation, LoginValidation } from "../validation/Auth.validation.js";
import { CreateUser, LogedInUser, LoginUser, LogoutUser } from "../controllers/User.controller.js";
import { Autherization } from "../middleware/Autherization.js";


const router = Router();

router.route("/register").post(Validater(AuthValidation),CreateUser);
router.route("/login").post(Validater(LoginValidation),LoginUser);
router.route("/loged-in-user").get(Autherization,LogedInUser);
router.route("/logout").get(Autherization,LogoutUser);


export default router;