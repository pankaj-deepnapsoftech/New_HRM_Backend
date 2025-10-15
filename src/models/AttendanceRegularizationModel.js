import mongoose from 'mongoose';

const attendanceRegularizationSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmpData',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD format
        required: true
    },
    requestType: {
        type: String,
        enum: ['checkin', 'checkout', 'both'],
        required: true
    },
    requestedCheckInTime: {
        type: String, // HH:mm:ss format
        default: ''
    },
    requestedCheckOutTime: {
        type: String, // HH:mm:ss format
        default: ''
    },
    reason: {
        type: String,
        required: true,
        maxlength: 500
    },
    supportingDocument: {
        type: String, // File path/URL
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    managerRemark: {
        type: String,
        default: ''
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
attendanceRegularizationSchema.index({ employeeId: 1, date: 1 });
attendanceRegularizationSchema.index({ status: 1 });
attendanceRegularizationSchema.index({ createdAt: -1 });

const AttendanceRegularization = mongoose.model('AttendanceRegularization', attendanceRegularizationSchema);

export default AttendanceRegularization;
