import express from 'express';
import {
    createDesignation,
    getAllDesignations,
    getActiveDesignations,
    getDesignationById,
    updateDesignation,
    deleteDesignation,
    toggleDesignationStatus
} from '../controllers/DesignationController.js';
import { Autherization } from '../middleware/Autherization.js';
import { AdminAuthorization } from '../middleware/AdminAuthorization.js';

const router = express.Router();

// All routes require admin authorization
router.use(Autherization);
router.use(AdminAuthorization);

// Designation routes
router.post('/', createDesignation);
router.get('/', getAllDesignations);
router.get('/active', getActiveDesignations);
router.get('/:id', getDesignationById);
router.put('/:id', updateDesignation);
router.delete('/:id', deleteDesignation);
router.patch('/:id/toggle-status', toggleDesignationStatus);

export default router;
