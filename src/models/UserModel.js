import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";


const UserSchema = new Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    employeeId: { type: String },
    loginCount: { type: Number, required: true, default: 0 },
    refreshToken: { type: String },
    verification: { type: Boolean, required: true, default: false },
    isMobile: { type: Boolean, required: true },
    browser: { type: String, required: true },
    userIp: { type: String, required: true },
    allowed_paths:{type:[String]}
});

UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

UserSchema.pre('findOneAndUpdate', async function (next) {
    if (!this._update.password) {
        return next();
    }
    this._update.password = await bcrypt.hash(this._update.password, 10);
    next();
});


export const UserModel = model("Users", UserSchema)


