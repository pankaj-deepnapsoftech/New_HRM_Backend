import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const SuperAdminSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, lowercase: true, unique: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
    verification: { type: Boolean, required: true, default: true },
    allowed_paths: { type: [String], default: [] },
    role: { type: String, required: true, default: 'SuperAdmin', enum: ['SuperAdmin'] },
  },
  { timestamps: true }
);

SuperAdminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

SuperAdminSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update?.password) {
    update.password = await bcrypt.hash(update.password, 10);
  }
  next();
});

export const SuperAdminModel = model('SuperAdmins', SuperAdminSchema);


