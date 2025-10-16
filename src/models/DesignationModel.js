import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DesignationSchema = new Schema({
    designationName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
DesignationSchema.index({ designationName: 1 });
DesignationSchema.index({ isActive: 1 });

const Designation = mongoose.model('Designation', DesignationSchema);

export default Designation;
