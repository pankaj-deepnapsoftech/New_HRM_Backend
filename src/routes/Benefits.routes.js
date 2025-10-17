import express from 'express';
import { Autherization } from '../middleware/Autherization.js';
import { AdminAuthorization } from '../middleware/AdminAuthorization.js';
import {
    getBenefits,
    upsertBenefits,
    getBenefitsHistory,
} from '../controllers/Benefits.controller.js';

const router = express.Router();

router.use(Autherization, AdminAuthorization);
router.get('/:empId', getBenefits);
router.get('/:empId/history', getBenefitsHistory);
router.post('/', upsertBenefits);

export default router;
