import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import { OtpModel } from '../models/Otp.model.js';
import { SendMail } from '../utils/SendMail.js';

const generateOtpCode = () => {
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    return code;
};

export const sendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Email is required' });
        }

        // Invalidate previous unused OTPs for this email
        await OtpModel.updateMany({ email, used: false }, { used: true });

        const code = generateOtpCode();
        const expiresAt = new Date(Date.now() + 45 * 1000); // 45 seconds

        await OtpModel.create({ email, code, expiresAt });

        await SendMail(
            'otp-code.ejs',
            { code },
            { subject: 'Your verification code', email }
        );

        return res.status(StatusCodes.OK).json({ message: 'OTP sent successfully' });
    } catch (err) {
        next(err);
    }
};

export const verifyOtp = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Email and code are required' });
        }

        const otp = await OtpModel.findOne({ email, code, used: false });
        if (!otp) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid OTP' });
        }

        if (otp.expiresAt < new Date()) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'OTP expired' });
        }

        otp.used = true;
        await otp.save();

        return res.status(StatusCodes.OK).json({ message: 'OTP verified' });
    } catch (err) {
        next(err);
    }
};


