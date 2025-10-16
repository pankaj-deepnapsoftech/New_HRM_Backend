// src/models/TerminatedEmployeesModel.js
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

// Replicate sub-schemas from EmpDataModel.js
const AttendanceSchema = new Schema({
    date: String,
    status: String,
    loginTime: String,
});

const NoteSchema = new Schema({
    text: String,
    timestamp: { type: Date, default: Date.now },
});

const IncentiveSchema = new Schema({
    amount: Number,
    date: { type: Date, default: Date.now },
    notes: String,
});

const GatePassRequestSchema = new Schema({
    reason: String,
    status: String,
    totalKm: Number,
    paymentPerKm: Number,
    companyWorkReason: String,
    totalPayment: Number,
    requestedAt: Date,
    approvedAt: Date,
});

const ShowCauseNoticeSchema = new Schema({
    department: String,
    reason: String,
    status: String,
    selectedEmployee: {
        name: String,
        employeeCode: String,
    },
    issuedAt: Date,
    reviewedAt: Date,
});

const RequestLeaveSchema = new Schema({
    fromDate: String,
    toDate: String,
    halfLeave: String,
    status: String,
    reason: String,
});

const TerminatedEmployeesSchema = new Schema(
    {
        adminId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        fname: String,
        lastName: { type: String, default: '' },
        email: { type: String, default: '' },
        password: { type: String, default: '' },
        confirmPassword: { type: String, default: '' },
        phoneNumber: { type: String, default: '' },
        dob: { type: String, default: '' },
        empCode: { type: String, default: '' },
        location: { type: String, default: '' },
        designation: String,
        department: String,
        date: { type: String, default: '' },
        avatar: { type: String, default: '' },
        salary: { type: Number, default: 0 },
        lastLoginTime: { type: String, default: '' },
        logoutTime: { type: String, default: '' },
        fullDayLeavesThisMonth: { type: Number, default: 0 },
        halfDayLeavesThisMonth: { type: Number, default: 0 },
        assets: { type: [String], default: [] },
        Empstatus: { type: String, default: 'Terminated' },
        lastSalaryIncrementDate: { type: Date, default: null },
        advanceEligibilityYears: { type: Number, default: 2 },
        requestLeave: { type: [RequestLeaveSchema], default: [] },
        attendance: { type: [AttendanceSchema], default: [] },
        advanceRequests: { type: [Schema.Types.Mixed], default: [] },
        notes: { type: [NoteSchema], default: [] },
        incentive: { type: [IncentiveSchema], default: [] },
        reimbursement: { type: [Schema.Types.Mixed], default: [] },
        gatePassRequests: { type: [GatePassRequestSchema], default: [] },
        showCauseNotices: { type: [ShowCauseNoticeSchema], default: [] },
        verificationDetails: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            default: null,
        },
        sub_department: { type: String },
        role: { type: String, default: 'Employee' },
        username: { type: String },
        verification: { type: Boolean, default: true },
        termsAndConditions: {
            submitted: { type: Boolean },
            submittedAt: { type: Date },
            version: { type: String },
            ipAddress: { type: String },
            userAgent: { type: String },
            agreementText: { type: String },
        },
        // NEW: Track termination date
        terminationDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.model('TerminatedEmployees', TerminatedEmployeesSchema);
