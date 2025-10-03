// models/Projectmodel.js
import mongoose from 'mongoose';
import './EmpDataModel.js';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmpData',
        required: true,
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EmpData',
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

const Project = mongoose.model('Project', projectSchema);
export default Project;
