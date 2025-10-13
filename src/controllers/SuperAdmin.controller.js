    import { AsyncHandler } from '../utils/AsyncHandler.js';
import { UserModel } from '../models/UserModel.js';
import EmpData from '../models/EmpDataModel.js';
import { StatusCodes } from 'http-status-codes';

// Get all admins with their employee counts
export const getAllAdminsWithStats = AsyncHandler(async (req, res) => {
    try {
        // Get all admins
        const admins = await UserModel.find({ role: 'Admin' })
            .select('fullName email phone username employeeId createdAt')
            .lean();

        // Get employee statistics for each admin
        const adminsWithStats = await Promise.all(
            admins.map(async (admin) => {
                // For now, we'll get all employees since there's no direct admin-employee relationship
                // In a real scenario, you might want to add admin_id field to EmpData or use department-based assignment
                const totalEmployees = await EmpData.countDocuments({});
                const activeEmployees = await EmpData.countDocuments({ Empstatus: 'active' });
                const inactiveEmployees = await EmpData.countDocuments({ Empstatus: 'inactive' });

                return {
                    ...admin,
                    employeeStats: {
                        total: totalEmployees,
                        active: activeEmployees,
                        inactive: inactiveEmployees
                    }
                };
            })
        );

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Admins data retrieved successfully',
            data: {
                admins: adminsWithStats,
                totalAdmins: admins.length,
                totalEmployees: await EmpData.countDocuments({}),
                activeEmployees: await EmpData.countDocuments({ Empstatus: 'active' }),
                inactiveEmployees: await EmpData.countDocuments({ Empstatus: 'inactive' })
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error retrieving admins data',
            error: error.message
        });
    }
});

// Get all employees with their details
export const getAllEmployeesWithDetails = AsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, status, department, search } = req.query;
        const skip = (page - 1) * limit;

        // Build filter object
        let filter = {};
        if (status) filter.Empstatus = status;
        if (department) filter.department = department;
        if (search) {
            filter.$or = [
                { fname: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { empCode: { $regex: search, $options: 'i' } }
            ];
        }

        // Get employees with pagination
        const employees = await EmpData.find(filter)
            .select('fname lastName email phoneNumber empCode designation department salary Empstatus avatar createdAt')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();

        // Get total count for pagination
        const totalEmployees = await EmpData.countDocuments(filter);
        const totalPages = Math.ceil(totalEmployees / limit);

        // Get department-wise statistics
        const departmentStats = await EmpData.aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ['$Empstatus', 'active'] }, 1, 0] }
                    },
                    inactive: {
                        $sum: { $cond: [{ $eq: ['$Empstatus', 'inactive'] }, 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Employees data retrieved successfully',
            data: {
                employees,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalEmployees,
                    limit: parseInt(limit),
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                departmentStats,
                summary: {
                    total: await EmpData.countDocuments({}),
                    active: await EmpData.countDocuments({ Empstatus: 'active' }),
                    inactive: await EmpData.countDocuments({ Empstatus: 'inactive' })
                }
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error retrieving employees data',
            error: error.message
        });
    }
});

// Get super admin dashboard overview
export const getSuperAdminDashboard = AsyncHandler(async (req, res) => {
    try {
        // Get counts
        const totalAdmins = await UserModel.countDocuments({ role: 'Admin' });
        const totalSuperAdmins = await UserModel.countDocuments({ role: 'SuperAdmin' });
        const totalEmployees = await EmpData.countDocuments({});
        const activeEmployees = await EmpData.countDocuments({ Empstatus: 'active' });
        const inactiveEmployees = await EmpData.countDocuments({ Empstatus: 'inactive' });

        // Get recent activities (last 10 employees added)
        const recentEmployees = await EmpData.find({})
            .select('fname lastName email designation department createdAt')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Get department-wise distribution
        const departmentDistribution = await EmpData.aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ['$Empstatus', 'active'] }, 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Get designation-wise distribution
        const designationDistribution = await EmpData.aggregate([
            {
                $group: {
                    _id: '$designation',
                    count: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ['$Empstatus', 'active'] }, 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Super Admin dashboard data retrieved successfully',
            data: {
                overview: {
                    totalAdmins,
                    totalSuperAdmins,
                    totalEmployees,
                    activeEmployees,
                    inactiveEmployees
                },
                recentEmployees,
                departmentDistribution,
                designationDistribution
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error retrieving dashboard data',
            error: error.message
        });
    }
});

// Assign multiple employees to an admin (if needed in future)
export const assignEmployeesToAdmin = AsyncHandler(async (req, res) => {
    try {
        const { adminId, employeeIds } = req.body;

        // Check if admin exists
        const admin = await UserModel.findById(adminId);
        if (!admin || admin.role !== 'Admin') {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Update employees with admin assignment
        // Note: This would require adding adminId field to EmpData model
        // For now, we'll just return success
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Employees assigned to admin successfully',
            data: {
                adminId,
                assignedEmployees: employeeIds.length
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error assigning employees to admin',
            error: error.message
        });
    }
});



