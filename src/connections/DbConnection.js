import mongoose from 'mongoose';
import { config } from '../config/env.config.js';
import { logger } from '../utils/Logger.js';

export const DbConnection = async () => {
    let isConnected = true;
    do {
        try {
            const connection = await mongoose.connect(config.MONGODB_URI, {
                dbName: 'HRM',
            });
            logger.info(
                `Mongodb database Connected successful and host is ${connection.connection.host}`
            );
            isConnected = false;
        } catch (error) {
            logger.error('Database not connected error');
            logger.error(error);
            isConnected = true;
        }
    } while (isConnected);
};
