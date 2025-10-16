import { UnauthorizedError, ForbiddenError } from '../utils/CustomError.js';
import { StatusCodes } from 'http-status-codes';

export const AdminAuthorization = async (req, res, next) => {
    try {
        console.log('AdminAuthorization - CurrentUser:', req.CurrentUser);
        
        // Check if user is authenticated (should be done by Autherization middleware first)
        if (!req.CurrentUser) {
            console.log('AdminAuthorization - No CurrentUser found');
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: 'User not authenticated'
            });
        }

        // Check if user has Admin role
        console.log('AdminAuthorization - User role:', req.CurrentUser.role);
        if (req.CurrentUser.role !== 'Admin') {
            console.log('AdminAuthorization - Access denied, role is:', req.CurrentUser.role);
            return res.status(StatusCodes.FORBIDDEN).json({
                message: 'Access denied. Admin privileges required.'
            });
        }

        next();
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Authorization error',
            error: error.message
        });
    }
};
