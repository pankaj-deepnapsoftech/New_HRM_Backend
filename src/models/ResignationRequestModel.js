import { Schema, model } from "mongoose";

const ResignationRequestSchema = new Schema({
    employeeId: { 
        type: Schema.Types.ObjectId, 
        ref: 'EmpData', 
        required: true 
    },
    adminId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    employeeName: {
        type: String,
        required: true
    },
    employeeCode: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    resignationDate: {
        type: Date,
        required: true
    },
    lastWorkingDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminComments: {
        type: String,
        default: ''
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    noticePeriod: {
        type: Number, // in days
        default: 30
    },
    handoverNotes: {
        type: String,
        default: ''
    },
    exitInterview: {
        conducted: {
            type: Boolean,
            default: false
        },
        feedback: {
            type: String,
            default: ''
        },
        conductedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        conductedAt: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true
});

// Index for better query performance
ResignationRequestSchema.index({ employeeId: 1, status: 1 });
ResignationRequestSchema.index({ adminId: 1, status: 1 });

export default model('ResignationRequest', ResignationRequestSchema);
