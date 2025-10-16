import { Schema, model } from 'mongoose';

const AnnouncementSchema = new Schema(
    {
        message: { type: String, required: true, trim: true },
        isActive: { type: Boolean, required: true, default: true },
        startsAt: { type: Date, default: null },
        endsAt: { type: Date, default: null },
        adminId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        // Targeted employee (null or "all" means announcement is shown to all)
        targetEmployee: { type: Schema.Types.Mixed, default: null },
    },
    { timestamps: true }
);

AnnouncementSchema.index({ isActive: 1, startsAt: 1, endsAt: 1, createdAt: -1 });

export const AnnouncementModel = model('Announcement', AnnouncementSchema);


