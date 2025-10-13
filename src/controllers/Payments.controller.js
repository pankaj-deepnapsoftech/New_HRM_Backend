import crypto from 'crypto';
import Razorpay from 'razorpay';
import { StatusCodes } from 'http-status-codes';
import { config } from '../config/env.config.js';
import { SubscriptionOrder } from '../models/SubscriptionOrder.model.js';
import { SubscriptionPayment } from '../models/SubscriptionPayment.model.js';
import { AsyncHandler } from '../utils/AsyncHandler.js';

const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID || config.RAZORPAY_KEY_ID;
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || config.RAZORPAY_KEY_SECRET;
const razorpay = new Razorpay({
    key_id: RZP_KEY_ID,
    key_secret: RZP_KEY_SECRET,
});

export const createOrder = AsyncHandler(async (req, res) => {
    if (!RZP_KEY_ID || !RZP_KEY_SECRET) {
        throw new Error('Razorpay keys missing in environment (.env)');
    }
    const userId = req?.CurrentUser?._id; // optional; can be null
    const { plan } = req.body;
    // Try to pull amount from a Razorpay Plan if configured
    let amountInPaise = 1000 * 100; // default 1000 INR yearly
    let planInfo = null;
    try {
        const envPlanId = process.env.RAZORPAY_PLAN_ID_PREMIUM || config.RAZORPAY_PLAN_ID_PREMIUM;
        if (envPlanId) {
            const fetchedPlan = await razorpay.plans.fetch(envPlanId);
            // fetchedPlan.amount is in paise
            amountInPaise = fetchedPlan?.amount ?? amountInPaise;
            planInfo = {
                id: fetchedPlan?.id,
                amount: fetchedPlan?.amount,
                currency: fetchedPlan?.currency,
                interval: fetchedPlan?.interval,
                period: fetchedPlan?.period,
                item: fetchedPlan?.item,
            };
        }
    } catch (_e) {
        // If plan fetch fails, continue with default amount
    }

    const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `sub_${Date.now()}`,
        notes: { plan },
    });

    await SubscriptionOrder.create({
        userId,
        plan,
        amount: amountInPaise,
        currency: 'INR',
        razorpayOrderId: order.id,
        status: 'created',
    });

    return res.status(StatusCodes.CREATED).json({
        success: true,
        data: {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            customer: {},
            plan: planInfo,
        },
    });
});

export const verifyPayment = AsyncHandler(async (req, res) => {
    if (!RZP_KEY_SECRET) {
        throw new Error('Razorpay secret missing in environment (.env)');
    }
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || config.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expected !== razorpay_signature) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Signature mismatch' });
    }

    const order = await SubscriptionOrder.findOne({ razorpayOrderId: razorpay_order_id });
    if (order) {
        order.status = 'paid';
        await order.save();
    }

    await SubscriptionPayment.create({
        userId: order?.userId,
        plan: order?.plan || 'premium',
        amount: order?.amount || 1000 * 100,
        currency: 'INR',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
    });

    return res.status(StatusCodes.OK).json({ success: true, message: 'Payment verified' });
});


