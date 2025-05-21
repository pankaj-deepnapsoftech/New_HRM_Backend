import { Schema,model } from "mongoose";


const EmployeeShema = new Schema({
    Emp_id:{type:Schema.Types.ObjectId,ref:"Users",required:true},
    aadhaar:{type:String,required:true},
    pancard:{type:String,required:true},
    photo:{type:String,required:true},
    Address:{type:String,required:true},
    Department:{type:String,required:true},
    Designation:{type:String,required:true},
    salary:{type:Number,required:true}
});

export const EmployeeModel = model("Employee",EmployeeShema);