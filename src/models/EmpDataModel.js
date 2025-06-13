// src/models/EmpDataModel.js
import mongoose from "mongoose";

const empDataSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  empCode: { type: String, required: true },
  salary: { type: Number, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

const EmpData = mongoose.model("EmpData", empDataSchema);
export default EmpData;
  
 


