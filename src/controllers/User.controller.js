import { StatusCodes } from "http-status-codes";
import moment from "moment";
import bcrypt from "bcrypt";

// local imports
import { UserModel } from "../models/UserModel.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { BadRequestError } from "../utils/CustomError.js";
import { SignToken } from "../utils/TokenGenerator.js";
import { config } from "../config/env.config.js";


const now = moment();
const midnight = moment().endOf('day');
const timeUntilMidnight = midnight.diff(now);


const CookiesOptions = (time) => {
    return {
        httpOnly: true,
        secure: config.NODE_ENV !== "development",
        maxAge: time,
        sameSite: 'none',
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
    res.cookie("rjt", refresh_token, CookiesOptions(timeUntilMidnight)).cookie("ajt", access_token, CookiesOptions(timeUntilMidnight + (10 * 60 * 1000)));
    return res.status(StatusCodes.CREATED).json({
        message: "User Register Successful",
        data: result,
        refresh_token,
        access_token
    })
})

export const LogedInUser = AsyncHandler(async (req,res) => {
    return res.status(StatusCodes.OK).json({
        message:"User",
        data:req?.CurrentUser
    })
});








