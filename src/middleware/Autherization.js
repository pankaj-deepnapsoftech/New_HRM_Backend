/* eslint-disable no-unsafe-optional-chaining */
import { VerifyToken } from '../utils/TokenGenerator.js';
import { UserModel } from '../models/UserModel.js';
import { UnauthorizedError } from '../utils/CustomError.js';
import { StatusCodes } from 'http-status-codes';

export const Autherization = async (req, res, next) => {
    try {
        const {ajt} = req.cookies || req.headers?.authorization?.split(' ')[1];

        const { email } = VerifyToken(ajt);
        const user = await UserModel.findOne({ email }).select(
            'fullName email phone username employeeId role'
        );
        if (!user) {
            next(
                new UnauthorizedError(
                    'User Not Autherized',
                    'Autherization methord'
                )
            );
        }
        req.CurrentUser = user;
        next();
    } catch (error) {
        console.error('Authorization error:', error);
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: 'user not verify',
        });
    }
};
