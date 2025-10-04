import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";

export const SignToken = (payload,time) => {
    return jwt.sign(payload,config.JWT_SECRET,{expiresIn:time});
}

export const VerifyToken = (token) => {
    try {
        return jwt.verify(token, config.JWT_SECRET);
    } catch (error) {
        console.log('Token verification error:', error.message);
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        } else {
            throw new Error('Token verification failed');
        }
    }
}


