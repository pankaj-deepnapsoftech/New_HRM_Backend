import express from 'express';
import { createOrder, verifyPayment } from '../controllers/Payments.controller.js';
import { Autherization } from '../middleware/Autherization.js';

const router = express.Router();

// Require auth so we can store userId on order and update subscription on verify
router.post('/create-order', Autherization, createOrder);
router.post('/verify', Autherization, verifyPayment);

export default router;


