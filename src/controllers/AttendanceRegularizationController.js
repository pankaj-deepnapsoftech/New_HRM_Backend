import { StatusCodes } from 'http-status-codes';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import { NotFoundError } from '../utils/CustomError.js';
import AttendanceRegularization from '../models/AttendanceRegularizationModel.js';
import EmpData from '../models/EmpDataModel.js';
import Attendance from '../models/AttendanceModel.js';
import moment from 'moment';

// Create attendance regularization request
export const createAttendanceRegularizationRequest = AsyncHandler(async (req, res) => {
    const { employeeId, date, requestType, requestedCheckInTime, requestedCheckOutTime, reason, supportingDocument } = req.body;

    // Validate required fields
    if (!employeeId || !date || !requestType || !reason) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Missing required fields: employeeId, date, requestType, reason'
        });
    }

    // Check if employee exists
    const employee = await EmpData.findById(employeeId);
    if (!employee) {
        throw new NotFoundError('Employee not found', 'createAttendanceRegularizationRequest');
    }

    // Check if request already exists for this date
    const existingRequest = await AttendanceRegularization.findOne({
        employeeId,
        date,
        status: { $in: ['pending', 'approved'] }
    });

    if (existingRequest) {
        return res.status(StatusCodes.CONFLICT).json({
            message: 'A regularization request already exists for this date'
        });
    }

    // Validate request type and times
    if (requestType === 'checkin' && !requestedCheckInTime) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Check-in time is required for checkin request type'
        });
    }

    if (requestType === 'checkout' && !requestedCheckOutTime) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Check-out time is required for checkout request type'
        });
    }

    if (requestType === 'both' && (!requestedCheckInTime || !requestedCheckOutTime)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Both check-in and check-out times are required for both request type'
        });
    }

    // Create the request
    const regularizationRequest = await AttendanceRegularization.create({
        employeeId,
        date,
        requestType,
        requestedCheckInTime: requestedCheckInTime || '',
        requestedCheckOutTime: requestedCheckOutTime || '',
        reason,
        supportingDocument: supportingDocument || '',
        status: 'pending'
    });

    res.status(StatusCodes.CREATED).json({
        message: 'Attendance regularization request created successfully',
        data: regularizationRequest
    });
});

// Get all pending regularization requests (for managers)
export const getPendingRegularizationRequests = AsyncHandler(async (req, res) => {
    const requests = await AttendanceRegularization.find({ status: 'pending' })
        .populate('employeeId', 'fname lastName empCode email department designation')
        .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
        message: 'Pending regularization requests retrieved successfully',
        data: requests
    });
});

// Get regularization requests by employee
export const getEmployeeRegularizationRequests = AsyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { employeeId };
    if (status) {
        query.status = status;
    }

    const requests = await AttendanceRegularization.find(query)
        .populate('approvedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await AttendanceRegularization.countDocuments(query);

    res.status(StatusCodes.OK).json({
        message: 'Employee regularization requests retrieved successfully',
        data: requests,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalRequests: total
        }
    });
});

// Approve or reject regularization request
export const updateRegularizationRequestStatus = AsyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { status, managerRemark, approvedBy } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Invalid status. Must be approved or rejected'
        });
    }

    const request = await AttendanceRegularization.findById(requestId);
    if (!request) {
        throw new NotFoundError('Regularization request not found', 'updateRegularizationRequestStatus');
    }

    if (request.status !== 'pending') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Request has already been processed'
        });
    }

    // Update request status
    request.status = status;
    request.managerRemark = managerRemark || '';
    request.approvedBy = approvedBy || null;
    request.approvedAt = new Date();

    await request.save();

    // If approved, update the attendance record
    if (status === 'approved') {
        await updateAttendanceFromRegularization(request);
    }

    res.status(StatusCodes.OK).json({
        message: `Regularization request ${status} successfully`,
        data: request
    });
});

// Helper function to update attendance record from approved regularization
const updateAttendanceFromRegularization = async (request) => {
    const { employeeId, date, requestType, requestedCheckInTime, requestedCheckOutTime } = request;

    const update = { status: 'Present' };
    if (requestType === 'checkin' || requestType === 'both') {
        update.loginTime = requestedCheckInTime;
    }
    if (requestType === 'checkout' || requestType === 'both') {
        update.logoutTime = requestedCheckOutTime;
    }

    // Atomic upsert by compound key (employeeId + date) to avoid duplicate inserts
    const attendanceRecord = await Attendance.findOneAndUpdate(
        { employeeId, date },
        { $set: update, $setOnInsert: { totalWorkingHours: '' } },
        { upsert: true, new: true }
    );

    // Calculate working hours if both times are available
    const hasIn = attendanceRecord.loginTime && attendanceRecord.loginTime.length > 0;
    const hasOut = attendanceRecord.logoutTime && attendanceRecord.logoutTime.length > 0;
    if (hasIn && hasOut) {
        const loginMoment = moment(`${date} ${attendanceRecord.loginTime}`, 'YYYY-MM-DD HH:mm:ss');
        const logoutMoment = moment(`${date} ${attendanceRecord.logoutTime}`, 'YYYY-MM-DD HH:mm:ss');
        const workingHours = logoutMoment.diff(loginMoment, 'hours', true);
        const total = workingHours.toFixed(2) + ' hours';
        if (attendanceRecord.totalWorkingHours !== total) {
            await Attendance.updateOne({ _id: attendanceRecord._id }, { $set: { totalWorkingHours: total } });
        }
    }
};

// Get regularization request by ID
export const getRegularizationRequestById = AsyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await AttendanceRegularization.findById(requestId)
        .populate('employeeId', 'fname lastName empCode email department designation')
        .populate('approvedBy', 'fullName email');

    if (!request) {
        throw new NotFoundError('Regularization request not found', 'getRegularizationRequestById');
    }

    res.status(StatusCodes.OK).json({
        message: 'Regularization request retrieved successfully',
        data: request
    });
});

// Delete regularization request (only if pending)
export const deleteRegularizationRequest = AsyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await AttendanceRegularization.findById(requestId);
    if (!request) {
        throw new NotFoundError('Regularization request not found', 'deleteRegularizationRequest');
    }

    if (request.status !== 'pending') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Cannot delete processed requests'
        });
    }

    await AttendanceRegularization.findByIdAndDelete(requestId);

    res.status(StatusCodes.OK).json({
        message: 'Regularization request deleted successfully'
    });
});
