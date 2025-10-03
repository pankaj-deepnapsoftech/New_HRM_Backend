import EmpData from '../models/EmpDataModel.js';
import mongoose from 'mongoose';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import { NotFoundError, ConflictError } from '../utils/CustomError.js';

// Submit terms and conditions agreement
export const submitTermsAndConditions = AsyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { agreementText, version = '1.0' } = req.body;

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Resolve identifiers from param or authenticated user
    const authUser = req.CurrentUser || {};
    const rawCandidates = [
        employeeId,
        authUser.employeeId,
        authUser.email,
        authUser._id,
    ]
        .filter(Boolean)
        .map(String)
        .filter(
            (v) =>
                v &&
                v.toLowerCase() !== 'undefined' &&
                v.toLowerCase() !== 'null'
        );

    // Build query candidates from all possible identifiers
    const queries = [];
    for (const cand of rawCandidates) {
        queries.push({ empCode: cand });
        queries.push({ email: cand });
        if (mongoose.Types.ObjectId.isValid(cand)) {
            queries.push({ _id: new mongoose.Types.ObjectId(cand) });
        }
    }

    // Find employee by any identifier; if none, ensure query returns no result
    const employee = await EmpData.findOne({
        $or: queries.length
            ? queries
            : [
                  {
                      _id: new mongoose.Types.ObjectId(
                          '000000000000000000000000'
                      ),
                  },
              ],
    });

    if (!employee) {
        throw new NotFoundError(
            'Employee not found',
            'submitTermsAndConditions'
        );
    }

    // Prevent duplicate submissions
    if (employee.termsAndConditions?.submitted) {
        throw new ConflictError(
            'Terms and conditions already submitted',
            'submitTermsAndConditions'
        );
    }

    // Update terms and conditions
    employee.termsAndConditions = {
        submitted: true,
        submittedAt: new Date(),
        version,
        ipAddress,
        userAgent,
        agreementText:
            agreementText || 'I agree to all the terms and conditions',
    };

    await employee.save();

    res.status(200).json({
        success: true,
        message: 'Terms and conditions submitted successfully',
        data: {
            employeeId: employee.empCode,
            employeeName: employee.fname,
            submittedAt: employee.termsAndConditions.submittedAt,
            version: employee.termsAndConditions.version,
        },
    });
});

// Get terms and conditions status for all employees
export const getAllTermsStatus = AsyncHandler(async (req, res) => {
    const employees = await EmpData.find(
        {},
        {
            fname: 1,
            lastName: 1,
            email: 1,
            empCode: 1,
            department: 1,
            termsAndConditions: 1,
        }
    );

    const termsStatus = employees.map((emp) => ({
        _id: emp._id,
        fullName: `${emp.fname} ${emp.lastName || ''}`.trim(),
        email: emp.email,
        employeeId: emp.empCode,
        department: emp.department,
        termsStatus: {
            submitted: emp.termsAndConditions?.submitted || false,
            submittedAt: emp.termsAndConditions?.submittedAt || null,
            version: emp.termsAndConditions?.version || '1.0',
        },
    }));

    res.status(200).json({
        success: true,
        message: 'Terms and conditions status retrieved successfully',
        data: termsStatus,
    });
});

// Get terms and conditions status for a specific employee
export const getEmployeeTermsStatus = AsyncHandler(async (req, res) => {
    const { employeeId } = req.params;

    const employee = await EmpData.findOne(
        { empCode: employeeId },
        {
            fname: 1,
            lastName: 1,
            email: 1,
            empCode: 1,
            department: 1,
            termsAndConditions: 1,
        }
    );

    if (!employee) {
        throw new NotFoundError('Employee not found', 'getEmployeeTermsStatus');
    }

    res.status(200).json({
        success: true,
        message: 'Employee terms status retrieved successfully',
        data: {
            _id: employee._id,
            fullName: `${employee.fname} ${employee.lastName || ''}`.trim(),
            email: employee.email,
            employeeId: employee.empCode,
            department: employee.department,
            termsStatus: {
                submitted: employee.termsAndConditions?.submitted || false,
                submittedAt: employee.termsAndConditions?.submittedAt || null,
                version: employee.termsAndConditions?.version || '1.0',
            },
        },
    });
});

// Send reminder for terms and conditions
export const sendTermsReminder = AsyncHandler(async (req, res) => {
    const { employeeId } = req.params;

    const candidates = [employeeId]
        .filter(Boolean)
        .map(String)
        .filter(
            (v) =>
                v &&
                v.toLowerCase() !== 'undefined' &&
                v.toLowerCase() !== 'null'
        );

    const orQuery = [];
    for (const cand of candidates) {
        orQuery.push({ empCode: cand });
        orQuery.push({ email: cand });
        if (mongoose.Types.ObjectId.isValid(cand)) {
            orQuery.push({ _id: new mongoose.Types.ObjectId(cand) });
        }
    }

    const employee = await EmpData.findOne({
        $or: orQuery.length
            ? orQuery
            : [
                  {
                      _id: new mongoose.Types.ObjectId(
                          '000000000000000000000000'
                      ),
                  },
              ],
    });

    if (!employee) {
        throw new NotFoundError('Employee not found', 'sendTermsReminder');
    }

    // Here you would typically send an email notification
    // For now, we'll just return a success message

    res.status(200).json({
        success: true,
        message: `Reminder sent to ${employee.fname} for terms and conditions submission`,
        data: {
            employeeId: employee.empCode,
            employeeName: employee.fname,
            email: employee.email,
        },
    });
});

// Get terms and conditions statistics
export const getTermsStatistics = AsyncHandler(async (req, res) => {
    const totalEmployees = await EmpData.countDocuments();
    const submittedCount = await EmpData.countDocuments({
        'termsAndConditions.submitted': true,
    });
    const notSubmittedCount = totalEmployees - submittedCount;

    res.status(200).json({
        success: true,
        message: 'Terms and conditions statistics retrieved successfully',
        data: {
            totalEmployees,
            submitted: submittedCount,
            notSubmitted: notSubmittedCount,
            submissionRate:
                totalEmployees > 0
                    ? ((submittedCount / totalEmployees) * 100).toFixed(2)
                    : 0,
        },
    });
});
