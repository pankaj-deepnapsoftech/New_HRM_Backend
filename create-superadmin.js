// Script to create a SuperAdmin user
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserModel } from './src/models/UserModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm');
        console.log('Connected to MongoDB');

        // Check if SuperAdmin already exists
        const existingSuperAdmin = await UserModel.findOne({ role: 'SuperAdmin' });
        if (existingSuperAdmin) {
            console.log('SuperAdmin already exists:', existingSuperAdmin.email);
            return;
        }

        // Create SuperAdmin user
        const superAdminData = {
            fullName: 'Super Admin',
            email: 'superadmin@company.com',
            phone: '9999999999',
            username: 'superadmin',
            password: 'SuperAdmin@123', // This will be hashed automatically
            role: 'SuperAdmin',
            verification: true
        };

        const superAdmin = new UserModel(superAdminData);
        await superAdmin.save();

        console.log('SuperAdmin created successfully:');
        console.log('Email:', superAdmin.email);
        console.log('Username:', superAdmin.username);
        console.log('Password: SuperAdmin@123');
        console.log('Role:', superAdmin.role);

    } catch (error) {
        console.error('Error creating SuperAdmin:', error.message);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};

// Run the script
createSuperAdmin();



