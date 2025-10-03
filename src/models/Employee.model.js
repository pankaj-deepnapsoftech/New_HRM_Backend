import { Schema, model } from 'mongoose';

const EmployeeShema = new Schema({
    Emp_id: { type: Schema.Types.ObjectId, required: true },
    refCollection: {
        type: String,
        enum: ['EmpData', 'TerminatedEmployees'],
        default: 'EmpData',
    },
    aadhaar: { type: String, required: true },
    pancard: { type: String, required: true },
    photo: { type: String, required: true },
    Driving_Licance: { type: String },
    Voter_Id: { type: String },
    UAN_number: { type: String },
    Bank_Account: { type: String, required: true },
    Back_Name: { type: String, required: true },
    IFSC_Code: { type: String, required: true },
    Bank_Proof: { type: String, required: true },
});

export const EmployeeModel = model('Employee', EmployeeShema);
