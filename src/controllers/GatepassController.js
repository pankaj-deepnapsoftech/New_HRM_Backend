import GatepassModel from '../models/GatepassModel.js';
import EmpData from '../models/EmpDataModel.js';

// Create a new gatepass request
export const createGatepassRequest = async (req, res) => {
  try {
    const { reason, requestDate, logoutTime, distance, workReason, estimatedPayment } = req.body;
    const employeeId = req.CurrentUser._id; // From auth middleware

    // Validate required fields
    if (!reason || !requestDate || !logoutTime || !distance || !workReason || !estimatedPayment) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    // Check if employee exists
    const employee = await EmpData.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        message: 'Employee not found'
      });
    }

    // Create gatepass request
    const gatepassRequest = new GatepassModel({
      employeeId,
      reason,
      requestDate: new Date(requestDate),
      logoutTime,
      distance: parseInt(distance),
      workReason,
      estimatedPayment: parseInt(estimatedPayment),
      status: 'pending'
    });

    await gatepassRequest.save();

    // Populate employee details for response
    await gatepassRequest.populate('employeeId', 'fname email employeeId department designation');

    res.status(201).json({
      message: 'Gatepass request submitted successfully',
      data: gatepassRequest
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to create gatepass request',
      error: err.message
    });
  }
};

// Get all gatepass requests (for admin)
export const getAllGatepassRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get gatepass requests with pagination
    const gatepassRequests = await GatepassModel.find(filter)
      .populate('employeeId', 'fname email employeeId department designation location')
      .populate('approvedBy', 'fullName email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GatepassModel.countDocuments(filter);

    res.status(200).json({
      message: 'Gatepass requests retrieved successfully',
      data: gatepassRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total,
        hasNextPage: skip + gatepassRequests.length < total,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch gatepass requests',
      error: err.message
    });
  }
};

// Get gatepass requests for a specific employee
export const getEmployeeGatepassRequests = async (req, res) => {
  try {
    const employeeId = req.CurrentUser._id; // From auth middleware
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const gatepassRequests = await GatepassModel.find({ employeeId })
      .populate('approvedBy', 'fullName email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GatepassModel.countDocuments({ employeeId });

    res.status(200).json({
      message: 'Employee gatepass requests retrieved successfully',
      data: gatepassRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total,
        hasNextPage: skip + gatepassRequests.length < total,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch employee gatepass requests',
      error: err.message
    });
  }
};

// Update gatepass request status (approve/reject)
export const updateGatepassStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.CurrentUser._id; // From auth middleware

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    // Find gatepass request
    const gatepassRequest = await GatepassModel.findById(id).populate('employeeId', 'fname email');
    if (!gatepassRequest) {
      return res.status(404).json({
        message: 'Gatepass request not found'
      });
    }

    // Check if already processed
    if (gatepassRequest.status !== 'pending') {
      return res.status(400).json({
        message: 'Gatepass request has already been processed'
      });
    }

    // Update gatepass request
    gatepassRequest.status = status;
    gatepassRequest.approvedBy = adminId;
    gatepassRequest.approvedAt = new Date();
    
    if (status === 'rejected' && rejectionReason) {
      gatepassRequest.rejectionReason = rejectionReason;
    }

    await gatepassRequest.save();

    res.status(200).json({
      message: `Gatepass request ${status} successfully`,
      data: gatepassRequest
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to update gatepass status',
      error: err.message
    });
  }
};

// Get gatepass request by ID
export const getGatepassRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const gatepassRequest = await GatepassModel.findById(id)
      .populate('employeeId', 'fname email employeeId department designation location')
      .populate('approvedBy', 'fullName email');

    if (!gatepassRequest) {
      return res.status(404).json({
        message: 'Gatepass request not found'
      });
    }

    res.status(200).json({
      message: 'Gatepass request retrieved successfully',
      data: gatepassRequest
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch gatepass request',
      error: err.message
    });
  }
};

// Delete gatepass request (allowed if status is 'pending' or 'rejected')
export const deleteGatepassRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.CurrentUser; // From auth middleware

    // Fetch the gatepass request by ID
    const gatepassRequest = await GatepassModel.findById(id).populate("employeeId");

    if (!gatepassRequest) {
      return res.status(404).json({
        message: "Gatepass request not found",
      });
    }

    // Check if current user is either the employee who created the request OR an admin
    const isOwner = gatepassRequest.employeeId._id.toString() === currentUser._id.toString();
    const isAdmin = currentUser.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Access denied. You are not allowed to delete this request.",
      });
    }

    // Allow deletion only if status is pending or rejected
    if (!["pending", "rejected"].includes(gatepassRequest.status)) {
      return res.status(400).json({
        message: "Cannot delete approved gatepass requests",
      });
    }

    // Proceed with deletion
    await GatepassModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Gatepass request deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to delete gatepass request",
      error: err.message,
    });
  }
};


