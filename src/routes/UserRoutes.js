// routes/UserRoutes.js
import express from 'express';
import { UserModel } from '../models/UserModel.js';


const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const users = await UserModel.find({}, 'fullName _id'); // return only name + id
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({
            message: 'Failed to fetch users',
            error: err.message,
        });
    }
});

export default router;
