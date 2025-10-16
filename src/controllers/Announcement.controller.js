import { StatusCodes } from 'http-status-codes';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import { BadRequestError, NotFoundError } from '../utils/CustomError.js';
import { AnnouncementModel } from '../models/AnnouncementModel.js';

export const createAnnouncement = AsyncHandler(async (req, res) => {
    const { message, isActive = true, startsAt, endsAt, targetEmployee = null } = req.body;
    if (!message || !message.trim()) {
        throw new BadRequestError('Message is required', 'createAnnouncement');
    }
    const doc = await AnnouncementModel.create({
        message: message.trim(),
        isActive: Boolean(isActive),
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        adminId: req?.CurrentUser?.adminId || req?.CurrentUser?._id,
        createdBy: req?.CurrentUser?._id,
        targetEmployee: targetEmployee === 'all' ? 'all' : (targetEmployee ? String(targetEmployee) : null),
    });
    // DEBUG: Log the created announcement
    console.log('CREATED ANNOUNCEMENT:', doc);
    res.status(StatusCodes.CREATED).json({ message: 'Announcement created', data: doc });
});

export const listAnnouncements = AsyncHandler(async (req, res) => {
    const adminId = req?.CurrentUser?.role === 'SuperAdmin' && req.query.adminId
        ? req.query.adminId
        : (req?.CurrentUser?.adminId || req?.CurrentUser?._id);
    const docs = await AnnouncementModel.find({ adminId }).sort({ createdAt: -1 });
    res.status(StatusCodes.OK).json({ message: 'Announcements', data: docs });
});

export const listActiveAnnouncements = AsyncHandler(async (req, res) => {
    const now = new Date();
    let adminId;
    if (req?.CurrentUser?.role === 'Employee') {
        // Employees should query by their adminId
        adminId = req?.CurrentUser?.adminId;
    } else if (req?.CurrentUser?.role === 'SuperAdmin' && req.query.adminId) {
        // Superadmin can specify any admin
        adminId = req.query.adminId;
    } else {
        // Admins use their own _id
        adminId = req?.CurrentUser?._id;
    }
    const employeeId = String(req?.CurrentUser?._id);
    // Debug
    console.log('Announcements active query', {
        adminId: String(adminId),
        now: now.toISOString(),
        employeeId
    });
    const docs = await AnnouncementModel.find({
        adminId,
        isActive: true,
        $or: [
            { targetEmployee: null },
            { targetEmployee: 'all' },
            { targetEmployee: employeeId },
        ],
    })
        .sort({ createdAt: -1 })
        .select('message createdAt');
    console.log('Active announcements matched (with targeting):', docs.length);
    res.status(StatusCodes.OK).json({ message: 'Active announcements', data: docs });
});

export const updateAnnouncement = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, isActive, startsAt, endsAt } = req.body;
    const update = {};
    if (message !== undefined) update.message = message.trim();
    if (isActive !== undefined) update.isActive = Boolean(isActive);
    if (startsAt !== undefined) update.startsAt = startsAt ? new Date(startsAt) : null;
    if (endsAt !== undefined) update.endsAt = endsAt ? new Date(endsAt) : null;
    const doc = await AnnouncementModel.findByIdAndUpdate(id, update, { new: true });
    if (!doc) throw new NotFoundError('Announcement not found', 'updateAnnouncement');
    res.status(StatusCodes.OK).json({ message: 'Announcement updated', data: doc });
});

export const deleteAnnouncement = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const doc = await AnnouncementModel.findByIdAndDelete(id);
    if (!doc) throw new NotFoundError('Announcement not found', 'deleteAnnouncement');
    res.status(StatusCodes.OK).json({ message: 'Announcement deleted' });
});


