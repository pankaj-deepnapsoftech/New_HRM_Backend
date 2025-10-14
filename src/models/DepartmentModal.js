import { Schema,model } from "mongoose";


const Department = new Schema({
    department_name:{type:String,required:true},
    sub_department: { type: String, required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'Users', index: true }

});

export const DepartmentModel = model("Department",Department);