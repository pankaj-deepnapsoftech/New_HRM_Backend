// src/controllers/EmpDataController.js
import EmpData from '../models/EmpDataModel.js';
import { UserModel } from '../models/UserModel.js';
import TerminatedEmployees from '../models/TerminatedEmployeesModel.js';
import { EmployeeModel } from '../models/Employee.model.js';
import mongoose from 'mongoose';
import Attendance from '../models/AttendanceModel.js';
import moment from 'moment';


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
export const getAssetByEmpId = async (req, res) => {
    try {
        const { id } = req.params;

        const empData = await EmpData.findById(id)
            .select('fname empCode assets ') 
           

        if (!empData) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(empData);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
};



export const createEmployeeCredentials = async (req, res) => {
    try {
        const empId = req.params.id;
        let { email, password } = req.body;
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
        await UserModel.findOne({ email });
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


export const terminateEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;

    // Find the employee in EmpData
    const emp = await EmpData.findById(id).session(session);
    if (!emp) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Create a new document in TerminatedEmployees
    const terminatedEmpData = {
      ...emp.toObject(), // Copy all fields
      _id: new mongoose.Types.ObjectId(), // Generate new ID
      terminationDate: new Date(), // Set termination date
      Empstatus: 'Terminated', // Ensure status is Terminated
    };
    const terminatedEmp = await TerminatedEmployees.create([terminatedEmpData], { session });

    // Update Employee collection to point to TerminatedEmployees
    if (emp.verificationDetails) {
      await EmployeeModel.findByIdAndUpdate(
        emp.verificationDetails,
        { Emp_id: terminatedEmp[0]._id, refCollection: 'TerminatedEmployees' }, // NEW: Track collection
        { session }
      );
    }

    // Delete from EmpData
    await EmpData.findByIdAndDelete(id, { session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Employee terminated and moved to TerminatedEmployees', data: terminatedEmp[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({
      message: 'Failed to terminate employee',
      error: err.message,
    });
  }
};


export const getAllTerminatedEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const employees = await TerminatedEmployees.find()
      .populate({
        path: "verificationDetails",
        select: "aadhaar pancard photo Bank_Proof Voter_Id Driving_Licance UAN_number Bank_Account Bank_Name IFSC_Code"
      })
      .skip(skip)
      .limit(limit)
      .sort({ terminationDate: -1 }); // Sort by most recent termination

    const total = await TerminatedEmployees.countDocuments();

    res.status(200).json({
      message: 'Paginated terminated employees',
      data: employees,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch terminated employees',
      error: err.message,
    });
  }
};

// NEW: Delete a terminated employee by ID
export const deleteTerminatedEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const terminatedEmp = await TerminatedEmployees.findById(id);
    if (!terminatedEmp) {
      return res.status(404).json({ message: 'Terminated employee not found' });
    }

    // Optional: Clean up related Employee data if needed
    if (terminatedEmp.verificationDetails) {
      await EmployeeModel.findByIdAndDelete(terminatedEmp.verificationDetails);
    }

    await TerminatedEmployees.findByIdAndDelete(id);

    res.status(200).json({ message: 'Terminated employee deleted successfully' });
  } catch (err) {
    res.status(400).json({
      message: 'Failed to delete terminated employee',
      error: err.message,
    });
  }
};


export const getDailyAttendance = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || moment().format('YYYY-MM-DD');
        
        // Get all employees
        const employees = await EmpData.find({}).select('fname email lastLoginTime logoutTime');
        
        // Get attendance data from new collection for the specific date
        const attendanceData = await Attendance.find({ date: targetDate }).populate('employeeId', 'fname email');
        
        // Create attendance map for quick lookup (use string keys and guard nulls)
        const attendanceMap = {};
        attendanceData.forEach(att => {
            if (!att || !att.employeeId) return; // skip if populate failed or reference missing
            const empId = att.employeeId._id ? att.employeeId._id.toString() : att.employeeId.toString();
            attendanceMap[empId] = att;
        });

        const attendanceReport = employees.map(emp => {
            const empKey = emp._id ? emp._id.toString() : String(emp._id);
            const dayAttendance = attendanceMap[empKey];
            
            return {
                _id: emp._id,
                fname: emp.fname,
                email: emp.email,
                status: dayAttendance ? dayAttendance.status : 'Absent',
                loginTime: dayAttendance ? dayAttendance.loginTime : '',
                logoutTime: dayAttendance ? dayAttendance.logoutTime : '',
                totalWorkingHours: dayAttendance ? dayAttendance.totalWorkingHours : '',
                loginLocation: dayAttendance ? dayAttendance.loginLocation : 'N/A',
                date: targetDate
            };
        });

        res.status(200).json({
            message: 'Daily attendance report retrieved successfully',
            data: attendanceReport
        });
    } catch (err) {
        res.status(400).json({
            message: 'Failed to get daily attendance report',
            error: err.message,
        });
    }
};


export const getEmployeeMonthlyAttendanceById = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year are required' });
        }

        const emp = await EmpData.findById(employeeId).select('fname email empCode department');
        if (!emp) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const startDate = moment(`${year}-${month}-01`).startOf('month');
        const endDate = moment(`${year}-${month}-01`).endOf('month');

        // Get attendance of employee for that month
        const attendanceData = await Attendance.find({
            employeeId,
            date: {
                $gte: startDate.format('YYYY-MM-DD'),
                $lte: endDate.format('YYYY-MM-DD')
            }
        }).sort({ date: 1 });

        // Create a complete list of dates for that month
        const daysInMonth = endDate.diff(startDate, 'days') + 1;
        const report = [];
        for (let i = 0; i < daysInMonth; i++) {
            const currentDate = moment(startDate).add(i, "days");
            // 👇 Skip future dates
            if (currentDate.isAfter(moment(), "day")) break;

            const dateStr = currentDate.format("YYYY-MM-DD");
            const attendance = attendanceData.find((a) => a.date === dateStr);

            report.push({
                date: dateStr,
                status: attendance ? attendance.status : "Absent",
                loginTime: attendance ? attendance.loginTime : "",
                logoutTime: attendance ? attendance.logoutTime : "",
                totalWorkingHours: attendance ? attendance.totalWorkingHours : "",
            });
        }


        const presentDays = report.filter(r => r.status === 'Present').length;
        const absentDays = daysInMonth - presentDays;

        res.status(200).json({
            message: 'Employee monthly attendance fetched successfully',
            employee: {
                id: emp._id,
                name: emp.fname,
                email: emp.email,
                empCode: emp.empCode,
                department: emp.department
            },
            month,
            year,
            totalDays: daysInMonth,
            presentDays,
            absentDays,
            data: report
        });
    } catch (err) {
        res.status(400).json({
            message: 'Failed to get employee monthly attendance',
            error: err.message
        });
    }
};


export const getEmployeeLeaveSummary = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const emp = await EmpData.findById(employeeId).select('allocatedLeaves usedLeaves remainingLeaves');
        if (!emp) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        return res.status(200).json({
            message: 'Leave summary fetched',
            data: {
                allocatedLeaves: emp.allocatedLeaves ?? 0,
                usedLeaves: emp.usedLeaves ?? 0,
                remainingLeaves: emp.remainingLeaves ?? Math.max(0, (emp.allocatedLeaves ?? 0) - (emp.usedLeaves ?? 0)),
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch leave summary', error: err.message });
    }
};

// Monthly/Yearly Attendance Report
export const getMonthlyAttendance = async (req, res) => {
    try {
        const { month, year, department } = req.query;
        
        // Validate month and year
        if (!month || !year) {
            return res.status(400).json({ 
                message: 'Month and year are required parameters' 
            });
        }

        // Create date range for the month
        const startDate = moment(`${year}-${month}-01`).startOf('month');
        const endDate = moment(`${year}-${month}-01`).endOf('month');

        // Build employee filter
        let employeeFilter = {};
        if (department && department !== 'all') {
            employeeFilter.department = department;
        }

        // Get all employees with department filter
        const employees = await EmpData.find(employeeFilter).select('fname email department designation empCode salary location');
        
        // Get attendance data for the entire month
        const attendanceData = await Attendance.find({
            date: {
                $gte: startDate.format('YYYY-MM-DD'),
                $lte: endDate.format('YYYY-MM-DD')
            }
        }).populate('employeeId', 'fname email department designation empCode salary location');

        // Create attendance summary for each employee
        const attendanceReport = employees.map(emp => {
            const empAttendance = attendanceData.filter(att => 
                att.employeeId && att.employeeId._id.toString() === emp._id.toString()
            );
            
            const presentDays = empAttendance.filter(att => att.status === 'Present').length;
            const absentDays = empAttendance.filter(att => att.status === 'Absent').length;
            const totalDays = endDate.diff(startDate, 'days') + 1;
            
            return {
                _id: emp._id,
                fname: emp.fname,
                email: emp.email,
                department: emp.department,
                designation: emp.designation,
                empCode: emp.empCode,
                salary: emp.salary,
                location: emp.location,
                presentDays,
                absentDays,
                totalDays,
                attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
            };
        });

        res.status(200).json({
            message: 'Monthly attendance report retrieved successfully',
            data: attendanceReport,
            filters: { month, year, department }
        });
    } catch (err) {
        res.status(400).json({
            message: 'Failed to get monthly attendance report',
            error: err.message,
        });
    }
};

// Yearly Attendance Report
export const getYearlyAttendance = async (req, res) => {
    try {
        const { year, department } = req.query;
        
        // Validate year
        if (!year) {
            return res.status(400).json({ 
                message: 'Year is required parameter' 
            });
        }

        // Create date range for the year
        const startDate = moment(`${year}-01-01`).startOf('year');
        const endDate = moment(`${year}-01-01`).endOf('year');

        // Build employee filter
        let employeeFilter = {};
        if (department && department !== 'all') {
            employeeFilter.department = department;
        }

        // Get all employees with department filter
        const employees = await EmpData.find(employeeFilter).select('fname email department designation empCode salary location');
        
        // Get attendance data for the entire year
        const attendanceData = await Attendance.find({
            date: {
                $gte: startDate.format('YYYY-MM-DD'),
                $lte: endDate.format('YYYY-MM-DD')
            }
        }).populate('employeeId', 'fname email department designation empCode salary location');

        // Create attendance summary for each employee
        const attendanceReport = employees.map(emp => {
            const empAttendance = attendanceData.filter(att => 
                att.employeeId && att.employeeId._id.toString() === emp._id.toString()
            );
            
            const presentDays = empAttendance.filter(att => att.status === 'Present').length;
            const absentDays = empAttendance.filter(att => att.status === 'Absent').length;
            const totalDays = endDate.diff(startDate, 'days') + 1;
            
            return {
                _id: emp._id,
                fname: emp.fname,
                email: emp.email,
                department: emp.department,
                designation: emp.designation,
                empCode: emp.empCode,
                salary: emp.salary,
                location: emp.location,
                presentDays,
                absentDays,
                totalDays,
                attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
            };
        });

        res.status(200).json({
            message: 'Yearly attendance report retrieved successfully',
            data: attendanceReport,
            filters: { year, department }
        });
    } catch (err) {
        res.status(400).json({
            message: 'Failed to get yearly attendance report',
            error: err.message,
        });
    }
};

export const markLoginAttendance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const currentDate = moment().format('YYYY-MM-DD');
        const currentTime = moment().format('HH:mm:ss');
        
        const emp = await EmpData.findById(employeeId);
        if (!emp) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Check if attendance already exists for today in new collection
        let todayAttendance = await Attendance.findOne({
            employeeId: employeeId,
            date: currentDate
        });

        if (todayAttendance) {
            // If attendance already exists for today, don't change login time
            // Only update status if needed and lastLoginTime in EmpData
            todayAttendance.status = 'Present';
            emp.lastLoginTime = currentTime;
            await todayAttendance.save();
            await emp.save();
            // Keep the original loginTime - don't update it
        } else {
            // Create new attendance record only if it's first login of the day
            todayAttendance = await Attendance.create({
                employeeId: employeeId,
                date: currentDate,
                status: 'Present',
                loginTime: currentTime,
                logoutTime: ''
            });
            emp.lastLoginTime = currentTime;
            await emp.save();
        }

        res.status(200).json({
            message: 'Login attendance marked successfully',
            data: {
                employeeId: emp._id,
                name: emp.fname,
                email: emp.email,
                date: currentDate,
                loginTime: todayAttendance.loginTime,
                status: 'Present'
            }
        });
    } catch (err) {
        res.status(400).json({
            message: 'Failed to mark login attendance',
            error: err.message,
        });
    }
};

export const markLogoutAttendance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const currentDate = moment().format('YYYY-MM-DD');
        const currentTime = moment().format('HH:mm:ss');
        
        const emp = await EmpData.findById(employeeId);
        if (!emp) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Find today's attendance record in new collection
        const todayAttendance = await Attendance.findOne({
            employeeId: employeeId,
            date: currentDate
        });

        if (todayAttendance && todayAttendance.loginTime) {
            // Update logout time
            todayAttendance.logoutTime = currentTime;
            emp.logoutTime = currentTime;
            
            // Calculate working hours
            if (todayAttendance.loginTime && todayAttendance.logoutTime) {
                const loginMoment = moment(`${currentDate} ${todayAttendance.loginTime}`, 'YYYY-MM-DD HH:mm:ss');
                const logoutMoment = moment(`${currentDate} ${todayAttendance.logoutTime}`, 'YYYY-MM-DD HH:mm:ss');
                const workingHours = logoutMoment.diff(loginMoment, 'hours', true);
                todayAttendance.totalWorkingHours = workingHours.toFixed(2) + ' hours';
            }
            
            await todayAttendance.save();
            await emp.save();

            res.status(200).json({
                message: 'Logout attendance marked successfully',
                data: {
                    employeeId: emp._id,
                    name: emp.fname,
                    email: emp.email,
                    date: currentDate,
                    loginTime: todayAttendance.loginTime,
                    logoutTime: currentTime,
                    status: todayAttendance.status,
                    totalWorkingHours: todayAttendance.totalWorkingHours
                }
            });
        } else {
            res.status(400).json({
                message: 'No login attendance found for today. Please login first.',
            });
        }
    } catch (err) {
        res.status(400).json({
            message: 'Failed to mark logout attendance',
            error: err.message,
        });
    }
};

// Get daily attendance report
// export const getDailyAttendance = async (req, res) => {
//     try {
//         const { date } = req.query;
//         const targetDate = date || moment().format('YYYY-MM-DD');
        
//         // Get all employees
//         const employees = await EmpData.find({}).select('fname email lastLoginTime logoutTime');
        
//         // Get attendance data from new collection for the specific date
//         const attendanceData = await Attendance.find({ date: targetDate }).populate('employeeId', 'fname email');
        
//         // Create attendance map for quick lookup (use string keys and guard nulls)
//         const attendanceMap = {};
//         attendanceData.forEach(att => {
//             // Skip malformed or unpopulated attendance entries
//             if (!att || !att.employeeId) return;

//             const empId = att.employeeId._id ? att.employeeId._id.toString() : att.employeeId.toString();
//             attendanceMap[empId] = att;
//         });

//         const attendanceReport = employees.map(emp => {
//             const empKey = emp._id ? emp._id.toString() : String(emp._id);
//             const dayAttendance = attendanceMap[empKey];
            
//             return {
//                 _id: emp._id,
//                 fname: emp.fname,
//                 email: emp.email,
//                 status: dayAttendance ? dayAttendance.status : 'Absent',
//                 loginTime: dayAttendance ? dayAttendance.loginTime : '',
//                 logoutTime: dayAttendance ? dayAttendance.logoutTime : '',
//                 totalWorkingHours: dayAttendance ? dayAttendance.totalWorkingHours : '',
//                 date: targetDate
//             };
//         });

//         res.status(200).json({
//             message: 'Daily attendance report retrieved successfully',
//             data: attendanceReport
//         });
//     } catch (err) {
//         res.status(400).json({
//             message: 'Failed to get daily attendance report',
//             error: err.message,
//         });
//     }
// };
