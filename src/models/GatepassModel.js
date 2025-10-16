import mongoose from 'mongoose';

const gatepassSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmpData',
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['Company Work', 'Personal Work', 'Medical Emergency', 'Other']
  },
  requestDate: {
    type: Date,
    required: true
  },
  logoutTime: {
    type: String,
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  workReason: {
    type: String,
    required: true
  },
  estimatedPayment: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
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
  rejectionReason: {
    type: String,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
gatepassSchema.index({ employeeId: 1, status: 1 });
gatepassSchema.index({ requestDate: 1 });
gatepassSchema.index({ status: 1 });

export default mongoose.model('Gatepass', gatepassSchema);
