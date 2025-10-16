import { Router } from 'express';
import { Autherization } from '../middleware/Autherization.js';
import { AdminAuthorization } from '../middleware/AdminAuthorization.js';
import {
    createAnnouncement,
    listAnnouncements,
    listActiveAnnouncements,
    updateAnnouncement,
    deleteAnnouncement,
} from '../controllers/Announcement.controller.js';

const router = Router();

// HR/Admin management endpoints
router.use(Autherization);
router.get('/', AdminAuthorization, listAnnouncements);
router.post('/', AdminAuthorization, createAnnouncement);
router.put('/:id', AdminAuthorization, updateAnnouncement);
router.delete('/:id', AdminAuthorization, deleteAnnouncement);

// Active announcements for current tenant (requires auth to resolve tenant)
router.get('/active', Autherization, listActiveAnnouncements);

export default router;


