import { Schema, model } from 'mongoose';

const OtpSchema = new Schema({
    email: { type: String, required: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ['email_verification'], default: 'email_verification' },
    // TTL index: ensure MongoDB automatically deletes expired OTPs
    expiresAt: { type: Date, required: true, index: true },
    used: { type: Boolean, default: false, index: true },
}, { timestamps: true });

OtpSchema.index({ email: 1, purpose: 1, used: 1, expiresAt: 1 });

// TTL index: remove docs when expiresAt passes; 0 means at the exact time
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'otp_expires_ttl' });

export const OtpModel = model('Otp', OtpSchema);


