import express from 'express';
import { createOrder, verifyPayment } from '../controllers/Payments.controller.js';

const router = express.Router();

// Public: allow creating order without login (userId stays null)
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

export default router;


