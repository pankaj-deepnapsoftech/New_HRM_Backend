import mongoose from 'mongoose';
import EmpData from './EmpDataModel.js';
const leaveEntrySchema = new mongoose.Schema(
    {
        from: { type: Date, required: true },
        to: { type: Date, required: true },
        type: {
            type: String,
            enum: ['casualLeave', 'sickLeave', 'paidLeave', 'emergencyLeave'],
            required: true,
        },
        mode: { type: String, enum: ['full', 'half'], default: 'full' },
        description: { type: String },
        file: { type: String }, // store path or URL
    },
    { _id: false }
);

const leaveSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EmpData',
            required: true,
        },
        month: { type: Number, required: true }, // 1-12
        year: { type: Number, required: true },

        // summary counters (can be fractional if half-days)
        casualLeave: { type: Number, default: 0 },
        sickLeave: { type: Number, default: 0 },
        paidLeave: { type: Number, default: 0 },
        emergencyLeave: { type: Number, default: 0 },

        // detailed entries
        leaves: [leaveEntrySchema],
    },
    { timestamps: true }
);

leaveSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Leave', leaveSchema);
