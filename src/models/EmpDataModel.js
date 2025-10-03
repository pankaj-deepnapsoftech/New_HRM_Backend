// // src/models/EmpDataModel.js
// import mongoose from "mongoose";

// const empDataSchema = new mongoose.Schema({
//   fname: { type: String, required: true },
//   department: { type: String, required: true },
//   designation: { type: String, required: true },
//   empCode: { type: String, required: true },
//   salary: { type: Number, required: true },
//   date: { type: Date, required: true },
// }, { timestamps: true });

// const EmpData = mongoose.model("EmpData", empDataSchema);
// export default EmpData;

// models/EmpData.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

const NoteSchema = new Schema({
    text: String,
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const IncentiveSchema = new Schema({
    amount: Number,
    date: {
        type: Date,
        default: Date.now,
    },
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

const TermsAndConditionsSchema = new Schema({
    submitted: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
    version: { type: String, default: '1.0' },
    ipAddress: String,
    userAgent: String,
    agreementText: String,
});

const RequestLeaveSchema = new Schema({
    fromDate: String,
    toDate: String,
    halfLeave: String,
    status: String,
    reason: String,
});

const EmpDataSchema = new Schema(
    {
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
        Empstatus: { type: String, default: 'active' },
        lastSalaryIncrementDate: { type: Date, default: null },
        advanceEligibilityYears: { type: Number, default: 2 },
        requestLeave: { type: [RequestLeaveSchema], default: [] },
        advanceRequests: { type: [Schema.Types.Mixed], default: [] },
        notes: { type: [NoteSchema], default: [] },
        incentive: { type: [IncentiveSchema], default: [] },
        reimbursement: { type: [Schema.Types.Mixed], default: [] },
        gatePassRequests: { type: [GatePassRequestSchema], default: [] },
        showCauseNotices: { type: [ShowCauseNoticeSchema], default: [] },
        termsAndConditions: { type: TermsAndConditionsSchema, default: {} },
        verificationDetails: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            default: null,
        },
        sub_department: {
            type: String,
        },
    },
    { timestamps: true }
);

// Add bcrypt middleware for password hashing
EmpDataSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

EmpDataSchema.pre('findOneAndUpdate', async function (next) {
    if (!this._update.password) {
        return next();
    }
    this._update.password = await bcrypt.hash(this._update.password, 10);
    next();
});

export default mongoose.model('EmpData', EmpDataSchema);
