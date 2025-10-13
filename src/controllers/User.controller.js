import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import path from 'path';

// local imports
import { UserModel } from '../models/UserModel.js';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
} from '../utils/CustomError.js';
import { SignToken, VerifyToken } from '../utils/TokenGenerator.js';
import { config } from '../config/env.config.js';
import { SendMail } from '../utils/SendMail.js';
import { BackendUrl } from '../constant.js';
import { LoginModel } from '../models/LoginDetail.model.js';
import EmpDataModel from '../models/EmpDataModel.js';
import Attendance from '../models/AttendanceModel.js';

const now = moment();
const midnight = moment().endOf('day');
const timeUntilMidnight = midnight.diff(now);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CookiesOptions = (time) => {
    return {
        httpOnly: true,
        secure: config.NODE_ENV !== 'development',
        maxAge: time,
        sameSite: config.NODE_ENV !== 'development' ? 'none' : 'Lax',
    };
};

export const CreateUser = AsyncHandler(async (req, res) => {
    const data = req.body;
    const userIp =
        req.headers['x-forwarded-for']?.split(',').shift() ||
        req.socket.remoteAddress;

    const exist = await UserModel.findOne({
        $or: [{ email: data.email }, { username: data.username }],
    });
    if (exist) {
        throw new BadRequestError('User Already Exist', 'CreateUser method');
    }

    // Determine user role (do not allow SuperAdmin creation here)
    let userRole = data.role === 'User' ? 'User' : 'Admin';
    if (data.role === 'SuperAdmin') {
        throw new BadRequestError('Use SuperAdmin signup endpoint', 'CreateUser method');
    }

    const refresh_token = SignToken(
        { email: data.email, username: data.username },
        '1day'
    );
    const access_token = SignToken(
        { email: data.email, username: data.username },
        '1day'
    );
    const result = await UserModel.create({
        ...data,
        role: userRole,
        refreshToken: refresh_token,
        userIp,
    });
    await LoginModel.create({
        userId: result._id,
        isMobile: data.isMobile,
        browser: data.browser,
        userIp,
    });
    result.password = null;

    res.cookie('rjt', refresh_token, CookiesOptions(timeUntilMidnight)).cookie(
        'ajt',
        access_token,
        CookiesOptions(timeUntilMidnight + 10 * 60 * 1000)
    );

    SendMail(
        'email-verification.ejs',
        {
            userName: result.username,
            verificationLink: `${BackendUrl}/user/verify-email?token=${access_token}`,
        },
        { subject: 'Verify Your Email', email: result.email }
    );

    return res.status(StatusCodes.CREATED).json({
        message: 'User Register Successful',
        data: result,
        refresh_token,
        access_token,
    });
});

export const LoginUser = AsyncHandler(async (req, res) => {
    const { username, password, browser, isMobile, loginType, location } = req.body;
    const userIp =
        req.headers['x-forwarded-for']?.split(',').shift() ||
        req.socket.remoteAddress;

    let exist;
    let isEmployee = false;

    // Always prefer EmpData (employee) if identifier exists there, regardless of loginType
    const EmpData = (await import('../models/EmpDataModel.js')).default;
    const empDoc = await EmpData.findOne({
        $or: [{ email: username }, { username }],
    });
    if (empDoc) {
        isEmployee = true;
        exist = empDoc;
        const isCurrect = bcrypt.compareSync(password, exist.password);
        if (!isCurrect) {
            throw new BadRequestError('Bad Credintial', 'LoginUser method');
        }
    } else {
        // Fallback to Users for admin/user
        exist = await UserModel.findOne({
            $or: [{ email: username }, { username }],
        });
        if (!exist) {
            throw new BadRequestError('Bad Credintial', 'LoginUser method');
        }

        const isCurrect = bcrypt.compareSync(password, exist.password);
        if (!isCurrect) {
            throw new BadRequestError('Bad Credintial', 'LoginUser method');
        }

        // Role-based login validation for admin/user
        if (loginType === 'admin' && !['Admin', 'SuperAdmin'].includes(exist.role)) {
            throw new BadRequestError('Bad Credintial', 'LoginUser method');
        }

        if (loginType === 'user' && ['Admin', 'SuperAdmin'].includes(exist.role)) {
            throw new BadRequestError('Bad Credintial', 'LoginUser method');
        }
    }

    const refresh_token = SignToken(
        { email: exist.email, username: exist.username },
        '1day'
    );
    const access_token = SignToken(
        { email: exist.email, username: exist.username },
        '1day'
    );

    let result;
    if (isEmployee) {
        // For employee login - update EmpData (no verification check needed)
        const currentDate = moment().format('YYYY-MM-DD');
        const currentTime = moment().format('HH:mm:ss');
        
        // Mark attendance for employee login (first login of the day only)
        let todayAttendance = await Attendance.findOne({
            employeeId: exist._id,
            date: currentDate
        });

        if (todayAttendance) {
            // If attendance already exists for today, don't change login time
            // Only update status if needed and lastLoginTime
            todayAttendance.status = 'Present';
            exist.lastLoginTime = currentTime;
            await todayAttendance.save();
            // Keep the original loginTime - don't update it
        } else {
            // Create new attendance record only if it's first login of the day
            todayAttendance = await Attendance.create({
                employeeId: exist._id,
                date: currentDate,
                status: 'Present',
                loginTime: currentTime,
                logoutTime: '',
                loginLocation: location || 'Unknown'
            });
            exist.lastLoginTime = currentTime;
        }

        // Update employee data and save
        exist.refreshToken = refresh_token;
        await exist.save();
        
        result = await exist.constructor
            .findById(exist._id)
            .select('fname email phoneNumber username role');
        await LoginModel.create({
            userId: result._id,
            isMobile,
            browser,
            userIp,
        });
    } else {
        // For admin/user login - update UserModel
        result = await UserModel.findByIdAndUpdate(exist._id, {
            refreshToken: refresh_token,
        }).select('fullName email phone username role');
        await LoginModel.create({
            userId: result._id,
            isMobile,
            browser,
            userIp,
        });

        // Only check verification for admin/user login, not for employee
        if (!exist.verification) {
            SendMail(
                'email-verification.ejs',
                {
                    userName: result.username,
                    verificationLink: `${BackendUrl}/user/verify-email?token=${access_token}`,
                },
                { subject: 'Verify Your Email', email: result.email }
            );
            return res.status(StatusCodes.FORBIDDEN).json({
                message: 'Email send in your Register mail please verify',
            });
        }
    }

    res.cookie('rjt', refresh_token, CookiesOptions(timeUntilMidnight)).cookie(
        'ajt',
        access_token,
        CookiesOptions(timeUntilMidnight + 10 * 60 * 1000)
    );
    return res.status(StatusCodes.CREATED).json({
        message: 'Login Successful',
        data: result,
        refresh_token,
        access_token,
    });
});

export const LogedInUser = AsyncHandler(async (req, res) => {
    return res.status(StatusCodes.OK).json({
        message: 'User',
        data: req?.CurrentUser,
    });
});
export const LogoutUser = AsyncHandler(async (req, res) => {
    const { isMobile, browser } = req.body;
    const userIp =
        req.headers['x-forwarded-for']?.split(',').shift() ||
        req.socket.remoteAddress;
    // Support both Users (admin/user) and EmpData (employee) sessions
    let userIdToLog = req?.CurrentUser?._id;
    if (!userIdToLog) {
        throw new NotFoundError('something Went wrong', 'LogoutUser method');
    }

    // Check if user is an employee and mark logout attendance
    const empData = await EmpDataModel.findById(userIdToLog);
    if (empData) {
        const currentDate = moment().format('YYYY-MM-DD');
        const currentTime = moment().format('HH:mm:ss');
        
        // Find today's attendance record in new collection
        const todayAttendance = await Attendance.findOne({
            employeeId: userIdToLog,
            date: currentDate
        });

        if (todayAttendance && todayAttendance.loginTime) {
            // Update logout time
            todayAttendance.logoutTime = currentTime;
            empData.logoutTime = currentTime;
            
            // Calculate working hours
            if (todayAttendance.loginTime && todayAttendance.logoutTime) {
                const loginMoment = moment(`${currentDate} ${todayAttendance.loginTime}`, 'YYYY-MM-DD HH:mm:ss');
                const logoutMoment = moment(`${currentDate} ${todayAttendance.logoutTime}`, 'YYYY-MM-DD HH:mm:ss');
                const workingHours = logoutMoment.diff(loginMoment, 'hours', true);
                todayAttendance.totalWorkingHours = workingHours.toFixed(2) + ' hours';
            }
            
            await todayAttendance.save();
            await empData.save();
        }
    }

    await LoginModel.create({ userId: userIdToLog, isMobile, browser, userIp });
    res.clearCookie('rjt')
        .clearCookie('ajt')
        .status(StatusCodes.ACCEPTED)
        .json({
            message: 'User loged out Successful',
        });
});

export const VerifyEmail = AsyncHandler(async (req, res) => {
    const { token } = req.query;
    const { email } = VerifyToken(token);
    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new BadRequestError('Invalid User', 'VerifyEmail method');
    }

    await UserModel.findByIdAndUpdate(user._id, { verification: true });
    res.redirect(
        config.NODE_ENV !== 'development'
            ? config.CLIENT_URL
            : config.LOCAL_CLIENT_URL
    );
});

export const ForgetPassword = AsyncHandler(async (req, res) => {
    const { email } = req.body;

    const adminData = await UserModel.findOne({ email });
    const empData = await EmpDataModel.findOne({ email });

    if (adminData) {
        const token = SignToken({ email }, '10min');

        SendMail(
            'forgetPassword.ejs',
            {
                userName: adminData.username,
                resetLink: `${BackendUrl}/user/verify-link?token=${token}`,
            },
            { subject: 'Forget Password Link', email }
        );
        return res.status(StatusCodes.OK).json({
            message: 'reset password link Send in your Email',
        });
    } else if (empData) {
        const token = SignToken({ email }, '10min');

        SendMail(
            'forgetPassword.ejs',
            {
                userName: empData.username,
                resetLink: `${BackendUrl}/user/verify-link?token=${token}`,
            },
            { subject: 'Forget Password Link', email }
        );
        return res.status(StatusCodes.OK).json({
            message: 'reset password link Send in your Email',
        });
    } else {
        throw new NotFoundError('Email Not Register', 'Forget Password Method');
    }
});

export const VerifyLink = AsyncHandler(async (req, res) => {
    const { token } = req.query;
    const { email } = VerifyToken(token);
    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new BadRequestError('User Not Found', 'VerifyLink Method');
    }
    const filepath = path.join(__dirname, '../../forgetPassword.html');
    res.sendFile(filepath);
});

export const ResetPassword = AsyncHandler(async (req, res) => {
    const { token } = req.query;
    const { password } = req.body;

    const { email } = VerifyToken(token);
    const user = await UserModel.findOne({ email });

    if (!user) {
        throw new NotFoundError('User not found', 'ResetPassword method');
    }

    await UserModel.findByIdAndUpdate(user._id, { password });

    return res.status(StatusCodes.OK).json({
        message: 'password updated Successful',
        redirectUrl:
            config.NODE_ENV !== 'development'
                ? config.CLIENT_URL
                : config.LOCAL_CLIENT_URL,
    });
});

export const ChangePassword = AsyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await UserModel.findById(req?.CurrentUser?._id);

    if (!user) {
        throw new NotFoundError('User Not Found', 'ChangePassword method');
    }

    const isCurrect = bcrypt.compareSync(oldPassword, user.password);

    if (!isCurrect) {
        throw new UnauthorizedError(
            'Old Password is not match',
            'ChangePassword method'
        );
    }
    await UserModel.findByIdAndUpdate(user._id, { password: newPassword });

    return res.status(StatusCodes.OK).json({
        message: 'Password Change Successful',
    });
});
