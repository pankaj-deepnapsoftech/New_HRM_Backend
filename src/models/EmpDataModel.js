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
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
  date: String,
  status: String,
  loginTime: String,
});

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

const RequestLeaveSchema = new Schema({
  fromDate: String,
  toDate: String,
  halfLeave: String,
  status: String,
  reason: String,
});

const BackgroundVerificationSchema = new Schema({
  addhar: String,
  pan: String,
  driving: String,
  voterCard: String,
  uan: String,
});

const BankVerificationSchema = new Schema({
  accountName: String,
  accountNumber: String,
  ifscCode: String,
  holderName: String,
});

const EmpDataSchema = new Schema(
  {
    fname: String,
    lastName: { type: String, default: "" },
    email: { type: String, default: "" },
    password: { type: String, default: "" },
    confirmPassword: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    dob: { type: String, default: "" },
    empCode: { type: String, default: "" },
    location: { type: String, default: "" },
    designation: String,
    department: String,
    date: { type: String, default: "" },
    avatar: { type: String, default: "" },
    salary: { type: Number, default: 0 },
    lastLoginTime: { type: String, default: "" },
    logoutTime: { type: String, default: "" },
    fullDayLeavesThisMonth: { type: Number, default: 0 },
    halfDayLeavesThisMonth: { type: Number, default: 0 },
    assets: { type: [String], default: [] },
    Empstatus: { type: String, default: "active" },
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
    backgroundVerification: {
      type: BackgroundVerificationSchema,
      default: {},  
    },
    bankVerification: {
      type: BankVerificationSchema,
      default: {},
    },
    sub_department:{
      type:String
    }
  },
  { timestamps: true }
);


export default mongoose.model("EmpData", EmpDataSchema);

