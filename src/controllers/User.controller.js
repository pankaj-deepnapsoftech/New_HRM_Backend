import { StatusCodes } from "http-status-codes";
import moment from "moment";
import bcrypt from "bcrypt";
import {fileURLToPath} from "url";
import path from "path";

// local imports
import { UserModel } from "../models/UserModel.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/CustomError.js";
import { SignToken, VerifyToken } from "../utils/TokenGenerator.js";
import { config } from "../config/env.config.js";
import { SendMail } from "../utils/SendMail.js";


const now = moment();
const midnight = moment().endOf('day');
const timeUntilMidnight = midnight.diff(now);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BackendUrl = config.NODE_ENV !== "development" ? config.BACKEND_URL : config.LOCAL_BACKEND_URL


const CookiesOptions = (time) => {
    return {
        httpOnly: true,
        secure: config.NODE_ENV !== "development",
        maxAge: time,
        sameSite: config.NODE_ENV !== "development" ? 'none' : "Lax",
    }
}

export const CreateUser = AsyncHandler(async (req, res) => {
    const data = req.body;
    const userIp = req.headers['x-forwarded-for']?.split(',').shift() || req.socket.remoteAddress;

    const exist = await UserModel.findOne({ $or: [{ email: data.email }, { username: data.username }] });
    if (exist) {
        throw new BadRequestError("User Already Exist", "CreateUser method");
    };

    const refresh_token = SignToken({ email: data.email, username: data.username }, "1day");
    const access_token = SignToken({ email: data.email, username: data.username }, "1day");
    const result = await UserModel.create({ ...data, refreshToken: refresh_token, userIp });
    result.password = null;

    res.cookie("rjt", refresh_token, CookiesOptions(timeUntilMidnight)).cookie("ajt", access_token, CookiesOptions(timeUntilMidnight + (10 * 60 * 1000)));

    SendMail("email-verification.ejs", { userName: result.username, verificationLink: `${BackendUrl}/user/verify-email?token=${access_token}` }, { subject: "Verify Your Email", email: result.email });

    return res.status(StatusCodes.CREATED).json({
        message: "User Register Successful",
        data: result,
        refresh_token,
        access_token
    });
});

export const LoginUser = AsyncHandler(async (req, res) => {
    const { username, password, browser, device } = req.body;
    const userIp = req.headers['x-forwarded-for']?.split(',').shift() || req.socket.remoteAddress;

    const exist = await UserModel.findOne({ $or: [{ email: username }, { username }] });
    if (!exist) {
        throw new BadRequestError("Bad Credintial", "LoginUser method");
    };

    const isCurrect = bcrypt.compareSync(password, exist.password);
    if (!isCurrect) {
        throw new BadRequestError("Bad Credintial", "LoginUser method");
    };



    const refresh_token = SignToken({ email: exist.email, username: exist.username }, "1day");
    const access_token = SignToken({ email: exist.email, username: exist.username }, "1day");
    const result = await UserModel.findByIdAndUpdate(exist._id, { refreshToken: refresh_token, userIp, browser, device }).select("fullName email phone username ");
    if (!exist.verification) {
       SendMail("email-verification.ejs", { userName: result.username, verificationLink: `${BackendUrl}/user/verify-email?token=${access_token}` }, { subject: "Verify Your Email", email: result.email })
        return res.status(StatusCodes.FORBIDDEN).json({
            message: "Email send in your Register mail please verify"
        })
    }
    res.cookie("rjt", refresh_token, CookiesOptions(timeUntilMidnight)).cookie("ajt", access_token, CookiesOptions(timeUntilMidnight + (10 * 60 * 1000)));
    return res.status(StatusCodes.CREATED).json({
        message: "Login Successful",
        data: result,
        refresh_token,
        access_token
    })
})

export const LogedInUser = AsyncHandler(async (req, res) => {
    return res.status(StatusCodes.OK).json({
        message: "User",
        data: req?.CurrentUser
    })
});

export const LogoutUser = AsyncHandler(async (req, res) => {
    const user = await UserModel.findById(req?.CurrentUser._id);
    if (!user) {
        throw new NotFoundError("something Went wrong", "LogoutUser method");
    };
    res.clearCookie('rjt').clearCookie("ajt").status(StatusCodes.ACCEPTED).json({
        message: "User loged out Successful"
    });
});

export const VerifyEmail = AsyncHandler(async (req, res) => {
    const { token } = req.query;
    const { email } = VerifyToken(token);
    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new BadRequestError("Invalid User", "VerifyEmail method")
    }

    await UserModel.findByIdAndUpdate(user._id, { verification: true });
    res.redirect(config.NODE_ENV !== "development" ? config.CLIENT_URL : config.LOCAL_CLIENT_URL)
});

export const ForgetPassword = AsyncHandler(async (req, res) => {
    const { email } = req.body;
    const data = await UserModel.findOne({ email });
    if (!data) {
        throw new NotFoundError("Email Not Register", "Forget Password Method");
    };

    const token = SignToken({email},"10min")

    SendMail("forgetPassword.ejs",{userName:data.username,resetLink:`${BackendUrl}/user/verify-link?token=${token}`},{subject:"Forget Password Link",email})
    return res.status(StatusCodes.OK).json({
        message:"reset password link Send in your Email"
    })

});

export const VerifyLink = AsyncHandler(async (req,res) => {
    const {token} = req.query;
    const {email} = VerifyToken(token);
    const user = await UserModel.findOne({email});
    if(!user){
      throw new BadRequestError("User Not Found","VerifyLink Method");
    }
    const filepath = path.join(__dirname,"../../forgetPassword.html");
    res.sendFile(filepath)
});










