// src/controllers/EmpDataController.js
import EmpData from '../models/EmpDataModel.js';
import { UserModel } from '../models/UserModel.js';

// Create new employee
export const addEmployee = async (req, res) => {
    try {
        const {
            fname,
            lastName,
            email,
            phoneNumber,
            dob,
            location,
            designation,
            department,
            date,
            salary,
        } = req.body;

        if (!department) {
            return res.status(400).json({
                message: 'Department is required for generating empCode',
            });
        }
        const deptPrefix = department.slice(0, 2).toUpperCase();
        const existingEmps = await EmpData.find({
            department,
            empCode: { $regex: `^${deptPrefix}\\d{3}$` },
        }).select('empCode');
        let maxNum = 0;
        if (existingEmps.length > 0) {
            const numbers = existingEmps.map((emp) =>
                parseInt(emp.empCode.slice(2), 10)
            );
            maxNum = Math.max(...numbers);
        }

        const nextNumber = (maxNum + 1).toString().padStart(3, '0');
        const empCode = `${deptPrefix}${nextNumber}`;

        const newEmp = new EmpData({
            fname,
            lastName,
            email,
            phoneNumber,
            dob,
            empCode,
            location,
            designation,
            department,
            date,
            salary,
            backgroundVerification: {
                addhar: req.files?.addhar ? req.files.addhar[0].filename : '',
                pan: req.files?.pan ? req.files.pan[0].filename : '',
                voterCard: req.files?.voterCard
                    ? req.files.voterCard[0].filename
                    : '',
                driving: req.files?.driving
                    ? req.files.driving[0].filename
                    : '',
            },
            bankVerification: {
                bankProof: req.files?.bankProof
                    ? req.files.bankProof[0].filename
                    : '',
            },
        });

        await newEmp.save();

        res.status(201).json({ message: 'Employee added', data: newEmp });
    } catch (err) {
        res.status(400).json({
            message: 'Failed to add employee',
            error: err.message,
        });
    }
};
// Get all employees (no pagination)
export const getAllEmployees = async (req, res) => {
    try {
        const employees = await EmpData.find();

        res.status(200).json({
            message: 'All employees fetched successfully',
            data: employees,
            total: employees.length,
        });
    } catch (err) {
        res.status(500).json({
            message: 'Failed to fetch employees',
            error: err.message,
        });
    }
};

// Get all employees with pagination
export const getAllEmployeesWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const employees = await EmpData.find()
            .populate({
                path: 'verificationDetails',
                select: 'aadhaar pancard photo Bank_Proof Voter_Id Driving_Licance UAN_number Bank_Account Bank_Name IFSC_Code',
            })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            message: 'Paginated employees',
            data: employees,
            currentPage: page,
        });
    } catch (err) {
        res.status(500).json({
            message: 'Failed to fetch employees',
            error: err.message,
        });
    }
};

// ✅ NEW: Add an asset to employee's assets array
export const addAssetToEmployee = async (req, res) => {
    try {
        const empId = req.params.id;
        const { asset } = req.body;

        if (!asset) {
            return res.status(400).json({ message: 'Asset is required' });
        }

        const updated = await EmpData.findByIdAndUpdate(
            empId,
            { $addToSet: { assets: asset } }, // avoid duplicates
            { new: true }
        );

        res.status(200).json({
            message: 'Asset added successfully',
            data: updated,
        });
    } catch (err) {
        res.status(400).json({
            message: 'Failed to add asset',
            error: err.message,
        });
    }
};

// ✅ NEW: Remove an asset from employee's assets array
export const removeAssetFromEmployee = async (req, res) => {
    try {
        const empId = req.params.id;
        const { asset } = req.body;

        if (!asset) {
            return res.status(400).json({ message: 'Asset is required' });
        }

        const updated = await EmpData.findByIdAndUpdate(
            empId,
            { $pull: { assets: asset } },
            { new: true }
        );

        res.status(200).json({
            message: 'Asset removed successfully',
            data: updated,
        });
    } catch (err) {
        res.status(400).json({
            message: 'Failed to remove asset',
            error: err.message,
        });
    }
};


export const createEmployeeCredentials = async (req, res) => {
    try {
        const empId = req.params.id;
        let { email, password, fullName, phone } = req.body;
        email = (email || '').trim().toLowerCase();
        password = typeof password === 'string' ? password.trim() : password;

        const emp = await EmpData.findById(empId);
        if (!emp) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (password && (password.length < 6 || password.length > 16)) {
            return res
                .status(400)
                .json({ message: 'Password must be 6-16 characters' });
        }

        // Prefer matching by email first
        let user = await UserModel.findOne({ email });
        // Generate a unique username based on email local-part
        const baseUsername = (email.split('@')[0] || 'employee').toLowerCase();
        const generateUniqueUsername = async () => {
            let candidate = baseUsername;
            let suffix = 1;
            // ensure uniqueness against existing usernames
            while (await UserModel.findOne({ username: candidate })) {
                candidate = `${baseUsername}${suffix++}`;
            }
            return candidate;
        };

        // Update EmpData with credentials instead of creating User
        const username = await generateUniqueUsername();
        const tempPassword = password || Math.random().toString(36).slice(-10) + '#A1';
        
        // Update EmpData with login credentials
        emp.email = email;
        emp.password = tempPassword;
        emp.username = username;
        emp.role = 'Employee';
        emp.verification = true;
        await emp.save();
        
        var generatedPassword = tempPassword;

        return res.status(200).json({
            message: 'Credentials created successfully',
            data: {
                employeeId: emp._id,
                email: emp.email,
                username: emp.username,
                tempPassword: generatedPassword,
            },
        });
    } catch (err) {
        if (err?.name === 'CastError') {
            return res.status(404).json({ message: 'Invalid employee id' });
        }
        return res.status(400).json({
            message: 'Failed to create credentials',
            error: err?.message || '',
        });
    }
};

// Update employee by ID
export const updateEmployee = async (req, res) => {
    try {
        const emp = await EmpData.findById(req.params.id);
        if (!emp)
            return res.status(404).json({ message: 'Employee not found' });

        // Update fields
        Object.assign(emp, req.body);

        // Update files if uploaded
        if (req.files?.addhar)
            emp.backgroundVerification.addhar = req.files.addhar[0].filename;
        if (req.files?.pan)
            emp.backgroundVerification.pan = req.files.pan[0].filename;
        if (req.files?.voterCard)
            emp.backgroundVerification.voterCard =
                req.files.voterCard[0].filename;
        if (req.files?.driving)
            emp.backgroundVerification.driving = req.files.driving[0].filename;
        if (req.files?.bankProof)
            emp.bankVerification.bankProof = req.files.bankProof[0].filename;

        await emp.save();

        res.status(200).json({ message: 'Employee updated', data: emp });
    } catch (err) {
        res.status(400).json({
            message: 'Failed to update employee',
            error: err.message,
        });
    }
};

// Delete employee by ID
export const deleteEmployee = async (req, res) => {
    try {
        await EmpData.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Employee deleted' });
    } catch (err) {
        res.status(400).json({
            message: 'Failed to delete employee',
            error: err.message,
        });
    }
};
