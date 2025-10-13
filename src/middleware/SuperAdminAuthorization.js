import { StatusCodes } from 'http-status-codes';

export const SuperAdminAuthorization = async (req, res, next) => {
    try {
        // Check if user is authenticated (should be done by Autherization middleware first)
        if (!req.CurrentUser) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: 'User not authenticated'
            });
        }

        // Check if user has SuperAdmin role
        if (req.CurrentUser.role !== 'SuperAdmin') {
            return res.status(StatusCodes.FORBIDDEN).json({
                message: 'Access denied. SuperAdmin privileges required.'
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
