import Attendance from '../models/AttendanceModel.js';
import { logger } from './Logger.js';

// Ensures attendances collection has only the correct compound unique index
export const ensureAttendanceIndexes = async () => {
  try {
    // Force model initialization so Mongoose knows indexes
    // and the collection is available
    const collection = Attendance.collection;

    const indexes = await collection.indexes();
    const badEmployeeOnlyIndex = indexes.find(
      (idx) => idx.name === 'employeeId_1' || (idx.key && Object.keys(idx.key).length === 1 && idx.key.employeeId === 1)
    );

    if (badEmployeeOnlyIndex) {
      try {
        await collection.dropIndex(badEmployeeOnlyIndex.name);
        logger.warn(`Dropped incorrect index on attendances: ${badEmployeeOnlyIndex.name}`);
      } catch (dropErr) {
        // If index doesn't exist or already dropped in race, ignore
        logger.error(`Failed to drop incorrect attendance index ${badEmployeeOnlyIndex.name}: ${dropErr?.message}`);
      }
    }

    // Ensure correct compound unique index exists
    // Mongoose defines it, but we enforce at runtime as well
    try {
      await collection.createIndex({ employeeId: 1, date: 1 }, { unique: true, name: 'employeeId_1_date_1' });
      logger.info('Ensured compound unique index attendances.employeeId_1_date_1');
    } catch (createErr) {
      logger.error(`Failed to ensure compound index on attendances: ${createErr?.message}`);
    }
  } catch (err) {
    logger.error(`Attendance index maintenance failed: ${err?.message}`);
  }
};


