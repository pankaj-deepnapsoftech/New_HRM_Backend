import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'EmpData',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Half Day'],
        default: 'Absent'
    },
    loginTime: {
        type: String,
        default: ''
    },
    logoutTime: {
        type: String,
        default: ''
    },
    totalWorkingHours: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Create compound index for efficient queries
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', AttendanceSchema);

export default Attendance;
