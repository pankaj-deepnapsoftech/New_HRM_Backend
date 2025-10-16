import { Router } from 'express';
import { sendOtp, verifyOtp } from '../controllers/Otp.controller.js';

const router = Router();

router.post('/send', sendOtp);
router.post('/verify', verifyOtp);

export default router;


