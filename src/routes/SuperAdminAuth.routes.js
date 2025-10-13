import express from 'express';
import { createSuperAdmin, loginSuperAdmin } from '../controllers/SuperAdminAuth.controller.js';

const router = express.Router();

// SuperAdmin authentication routes (no middleware needed as these are public endpoints)
router.post('/signup', createSuperAdmin);
router.post('/login', loginSuperAdmin);

export default router;



