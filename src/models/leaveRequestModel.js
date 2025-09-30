import mongoose from "mongoose";
import EmpData from './EmpDataModel.js'

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "EmpData", required: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    type: {
      type: String,
      enum: ["casualLeave", "sickLeave", "paidLeave", "emergencyLeave"],
      required: true,
    },
    mode: { type: String, enum: ["full", "half"], default: "full" },
    description: { type: String },
    file: { type: String }, // path/url of uploaded proof
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    hrRemark: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("LeaveRequest", leaveRequestSchema);
