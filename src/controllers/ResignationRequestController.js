import ResignationRequest from '../models/ResignationRequestModel.js';
import EmpData from '../models/EmpDataModel.js';

// Create resignation request
export const createResignationRequest = async (req, res) => {
    try {
        const {
            resignationDate,
            lastWorkingDate,
            reason,
            noticePeriod,
            handoverNotes
        } = req.body;

        const employeeId = req.CurrentUser._id;

        // Check if employee already has a pending resignation request
        const existingRequest = await ResignationRequest.findOne({
            employeeId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending resignation request'
            });
        }

        // Get employee details
        const employee = await EmpData.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Create resignation request
        const resignationRequest = new ResignationRequest({
            employeeId,
            adminId: employee.adminId,
            employeeName: `${employee.fname} ${employee.lastName}`,
            employeeCode: employee.empCode,
            department: employee.department,
            designation: employee.designation,
            resignationDate: new Date(resignationDate),
            lastWorkingDate: new Date(lastWorkingDate),
            reason,
            noticePeriod: noticePeriod || 30,
            handoverNotes
        });

        await resignationRequest.save();

        res.status(201).json({
            success: true,
            message: 'Resignation request submitted successfully',
            data: resignationRequest
        });

    } catch (error) {
        console.error('Error creating resignation request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create resignation request',
            error: error.message
        });
    }
};

// Get resignation requests for admin
export const getResignationRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const adminId = req.CurrentUser._id;

        let filter = { adminId };
        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const requests = await ResignationRequest.find(filter)
            .populate('employeeId', 'fname lastName email phoneNumber avatar')
            .populate('approvedBy', 'fname lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ResignationRequest.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: requests,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        console.error('Error fetching resignation requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resignation requests',
            error: error.message
        });
    }
};

// Get employee's own resignation requests
export const getEmployeeResignationRequests = async (req, res) => {
    try {
        const employeeId = req.CurrentUser._id;

        const requests = await ResignationRequest.find({ employeeId })
            .populate('approvedBy', 'fname lastName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Error fetching employee resignation requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resignation requests',
            error: error.message
        });
    }
};

// Update resignation request status (approve/reject)
export const updateResignationRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminComments } = req.body;
        const adminId = req.CurrentUser._id;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be approved or rejected'
            });
        }

        const resignationRequest = await ResignationRequest.findById(id);
        if (!resignationRequest) {
            return res.status(404).json({
                success: false,
                message: 'Resignation request not found'
            });
        }

        if (resignationRequest.adminId.toString() !== adminId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this request'
            });
        }

        if (resignationRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been processed'
            });
        }

        // Update the request
        resignationRequest.status = status;
        resignationRequest.adminComments = adminComments;
        resignationRequest.approvedBy = adminId;
        resignationRequest.approvedAt = new Date();

        await resignationRequest.save();

        // If approved, update employee status
        if (status === 'approved') {
            await EmpData.findByIdAndUpdate(resignationRequest.employeeId, {
                Empstatus: 'resigned',
                lastWorkingDate: resignationRequest.lastWorkingDate
            });
        }

        res.status(200).json({
            success: true,
            message: `Resignation request ${status} successfully`,
            data: resignationRequest
        });

    } catch (error) {
        console.error('Error updating resignation request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update resignation request',
            error: error.message
        });
    }
};

// Get resignation request by ID
export const getResignationRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const resignationRequest = await ResignationRequest.findById(id)
            .populate('employeeId', 'fname lastName email phoneNumber avatar')
            .populate('approvedBy', 'fname lastName');

        if (!resignationRequest) {
            return res.status(404).json({
                success: false,
                message: 'Resignation request not found'
            });
        }

        res.status(200).json({
            success: true,
            data: resignationRequest
        });

    } catch (error) {
        console.error('Error fetching resignation request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resignation request',
            error: error.message
        });
    }
};

// Cancel resignation request (employee only)
export const cancelResignationRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.CurrentUser._id;

        const resignationRequest = await ResignationRequest.findById(id);
        if (!resignationRequest) {
            return res.status(404).json({
                success: false,
                message: 'Resignation request not found'
            });
        }

        if (resignationRequest.employeeId.toString() !== employeeId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to cancel this request'
            });
        }

        if (resignationRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a processed request'
            });
        }

        await ResignationRequest.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Resignation request cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling resignation request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel resignation request',
            error: error.message
        });
    }
};
