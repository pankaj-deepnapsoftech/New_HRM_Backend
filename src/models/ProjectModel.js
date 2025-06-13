// models/Project.js
import mongoose from "mongoose";
import "./UserModel.js"; 

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users", 
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users", 
    },
  ],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
  },
});

const Project = mongoose.model("Project", projectSchema);
export default Project;
  
