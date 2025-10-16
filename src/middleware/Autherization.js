/* eslint-disable no-unsafe-optional-chaining */
import { VerifyToken } from '../utils/TokenGenerator.js';
import { UserModel } from '../models/UserModel.js';
import { SuperAdminModel } from '../models/SuperAdmin.model.js';
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
            bearerToken: bearer ? 'exists' : 'missing',
            allCookies: req.cookies,
        });

        if (!token) {
            return next(
                new UnauthorizedError(
                    'User Not Autherized',
                    'Autherization methord'
                )
            );
        }

        const { email } = VerifyToken(token);
        console.log('Token verified for email:', email);

        // First try SuperAdmins
        let current = await SuperAdminModel.findOne({ email }).select(
            'fullName email phone username role'
        );
        console.log(
            'SuperAdmin search result:',
            current ? 'Found' : 'Not found'
        );

        // If not found, try Users collection (Admin/User)
        if (!current) {
            const userDoc = await UserModel.findOne({ email }).select(
                'fullName email phone username employeeId role isSubscribed trialEndsAt'
            );
            console.log('User search result:', userDoc ? 'Found' : 'Not found');
            if (userDoc) {
                // For Admin, set adminId to self for tenant scoping
                if (userDoc.role === 'Admin') {
                    current = { ...userDoc.toObject(), adminId: userDoc._id };
                } else {
                    current = userDoc;
                }
            }
        }

        // If not found, try EmpData (Employee)
        if (!current) {
            const EmpData = (await import('../models/EmpDataModel.js')).default;
            const emp = await EmpData.findOne({ email }).select(
                'fname email phoneNumber username role adminId'
            );
            console.log('Employee search result:', emp ? 'Found' : 'Not found');
            if (emp) {
                // Normalize to a common shape
                current = {
                    _id: emp._id,
                    fullName: emp.fname,
                    email: emp.email,
                    phone: emp.phoneNumber,
                    username: emp.username,
                    role: 'Employee',
                    adminId: emp.adminId,
                    isEmployee: true,
                };
            }
        }

        if (!current) {
            return next(
                new UnauthorizedError(
                    'User Not Autherized',
                    'Autherization methord'
                )
            );
        }

        console.log('Setting CurrentUser:', {
            _id: current._id,
            email: current.email,
            role: current.role,
            fullName: current.fullName,
        });

        req.CurrentUser = current;
        next();
    } catch (error) {
        console.log('Authorization error:', error);
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: 'user not verify',
        });
    }
};
