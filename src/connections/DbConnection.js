import mongoose from "mongoose";
import { config } from "../config/env.config.js";
import { logger } from "../utils/Logger.js";
import { ensureAttendanceIndexes } from "../utils/IndexMaintenance.js";

export const DbConnection = async () => {
   let isConnected = true;
    do{
        try {
            const connection = await mongoose.connect(config.MONGODB_URI,{dbName:"HRM"});
            logger.info(`Mongodb database Connected successful and host is ${connection.connection.host}`);

            // Ensure indexes after successful connection
            try {
                await ensureAttendanceIndexes();
            } catch (idxErr) {
                logger.error(`Index maintenance error: ${idxErr?.message}`);
            }

            isConnected = false;
        } catch (error) {
            logger.error("Database not connected error");
            logger.error(error);
            isConnected = true;
        }
    }while(isConnected)
}