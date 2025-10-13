import { AsyncHandler } from '../utils/AsyncHandler.js';
import { UserModel } from '../models/UserModel.js';
import { SuperAdminModel } from '../models/SuperAdmin.model.js';
import { BadRequestError } from '../utils/CustomError.js';
import { StatusCodes } from 'http-status-codes';
import { SignToken } from '../utils/TokenGenerator.js';
import { LoginModel } from '../models/LoginDetail.model.js';
import { SendMail } from '../utils/SendMail.js';
import { BackendUrl } from '../constant.js';
import bcrypt from 'bcrypt';
import moment from 'moment';

const now = moment();
const midnight = moment().endOf('day');
const timeUntilMidnight = midnight.diff(now);

const CookiesOptions = (time) => {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: time,
        sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'Lax',
    };
};

// SuperAdmin Signup
export const createSuperAdmin = AsyncHandler(async (req, res) => {
    const data = req.body;
    const userIp = req.headers['x-forwarded-for']?.split(',').shift() || req.socket.remoteAddress;

    // Check if user already exists in either collection
    const existInUsers = await UserModel.findOne({
        $or: [{ email: data.email }, { username: data.username }],
    });
    const existInSuperAdmins = await SuperAdminModel.findOne({
        $or: [{ email: data.email }, { username: data.username }],
    });
    if (existInUsers || existInSuperAdmins) {
        throw new BadRequestError('User Already Exist', 'createSuperAdmin method');
    }

    // Check if SuperAdmin already exists (in SuperAdmins collection)
    const superAdminCount = await SuperAdminModel.countDocuments({});
    if (superAdminCount > 0) {
        throw new BadRequestError('SuperAdmin already exists', 'createSuperAdmin method');
    }

    // Generate tokens
    const refresh_token = SignToken(
        { email: data.email, username: data.username },
        '1day'
    );
    const access_token = SignToken(
        { email: data.email, username: data.username },
        '1day'
    );

    // Create SuperAdmin user in its own collection
    const result = await SuperAdminModel.create({
        ...data,
        role: 'SuperAdmin',
        verification: true, // SuperAdmin doesn't need email verification
        refreshToken: refresh_token,
        userIp,
    });

    // Create login record
    await LoginModel.create({
        userId: result._id,
        isMobile: data.isMobile,
        browser: data.browser,
        userIp,
    });

    // Remove password from response
    result.password = null;

    // Set cookies
    res.cookie('rjt', refresh_token, CookiesOptions(timeUntilMidnight)).cookie(
        'ajt',
        access_token,
        CookiesOptions(timeUntilMidnight + 10 * 60 * 1000)
    );

    // Send welcome email
    SendMail(
        'email-verification.ejs',
        {
            userName: result.username,
            verificationLink: `${BackendUrl}/user/verify-email?token=${access_token}`,
        },
        { subject: 'SuperAdmin Account Created', email: result.email }
    );

    return res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'SuperAdmin account created successfully',
        data: result,
        refresh_token,
        access_token,
    });
});

// SuperAdmin Login
export const loginSuperAdmin = AsyncHandler(async (req, res) => {
    const { username, password, browser, isMobile, location } = req.body;
    const userIp = req.headers['x-forwarded-for']?.split(',').shift() || req.socket.remoteAddress;

    // Find SuperAdmin user in SuperAdmins collection
    const exist = await SuperAdminModel.findOne({
        $or: [{ email: username }, { username }],
        role: 'SuperAdmin'
    });

    if (!exist) {
        throw new BadRequestError('Invalid SuperAdmin credentials', 'loginSuperAdmin method');
    }

    // Verify password
    const isCorrect = await bcrypt.compare(password, exist.password);
    if (!isCorrect) {
        throw new BadRequestError('Invalid SuperAdmin credentials', 'loginSuperAdmin method');
    }

    // Generate tokens
    const refresh_token = SignToken(
        { email: exist.email, username: exist.username },
        '1day'
    );
    const access_token = SignToken(
        { email: exist.email, username: exist.username },
        '1day'
    );

    // Update user with new tokens
    const result = await SuperAdminModel.findByIdAndUpdate(exist._id, {
        refreshToken: refresh_token,
    }).select('fullName email phone username role');

    // Create login record
    await LoginModel.create({
        userId: result._id,
        isMobile,
        browser,
        userIp,
    });

    // Set cookies
    res.cookie('rjt', refresh_token, CookiesOptions(timeUntilMidnight)).cookie(
        'ajt',
        access_token,
        CookiesOptions(timeUntilMidnight + 10 * 60 * 1000)
    );

    return res.status(StatusCodes.OK).json({
        success: true,
        message: 'SuperAdmin login successful',
        data: result,
        refresh_token,
        access_token,
    });
});
