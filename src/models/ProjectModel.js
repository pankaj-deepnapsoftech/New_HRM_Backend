import mongoose from "mongoose";

const projectScheam = new mongoose.Schema({
	name: {
		type: String,
    required: true,
	},
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
  }],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String
  }
});

const Project = mongoose.model("Project", projectScheam);
export default Project;
