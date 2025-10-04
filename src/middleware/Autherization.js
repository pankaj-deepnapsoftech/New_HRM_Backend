/* eslint-disable no-unsafe-optional-chaining */
import { VerifyToken } from '../utils/TokenGenerator.js';
import { UserModel } from '../models/UserModel.js';
import { UnauthorizedError } from '../utils/CustomError.js';
import { StatusCodes } from 'http-status-codes';

export const Autherization = async (req, res, next) => {
    try {
        // Get JWT from cookie or Authorization: Bearer <token>
        const bearer = req.headers?.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : undefined;
        const token = req.cookies?.ajt || bearer;

        console.log('Auth Debug:', {
            hasCookie: !!req.cookies?.ajt,
            hasBearer: !!bearer,
            cookieToken: req.cookies?.ajt ? 'exists' : 'missing',
            bearerToken: bearer ? 'exists' : 'missing'
        });

        if (!token) {
            return next(new UnauthorizedError('User Not Autherized', 'Autherization methord'));
        }

        const { email } = VerifyToken(token);
        console.log('Token verified for email:', email);

        // First try Users collection (Admin/User)
        let current = await UserModel.findOne({ email }).select(
            'fullName email phone username employeeId role'
        );

        // If not found, try EmpData (Employee)
        if (!current) {
            const EmpData = (await import('../models/EmpDataModel.js')).default;
            const emp = await EmpData.findOne({ email }).select('fname email phoneNumber username role');
            if (emp) {
                // Normalize to a common shape
                current = {
                    _id: emp._id,
                    fullName: emp.fname,
                    email: emp.email,
                    phone: emp.phoneNumber,
                    username: emp.username,
                    role: 'Employee',
                    isEmployee: true,
                };
            }
        }

        if (!current) {
            return next(new UnauthorizedError('User Not Autherized', 'Autherization methord'));
        }

        req.CurrentUser = current;
        next();
    } catch (error) {
        console.log('Authorization error:', error);
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: 'user not verify',
        });
    }
};
