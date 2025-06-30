// src/controllers/EmpDataController.js
import EmpData from "../models/EmpDataModel.js";

// Create new employee
export const addEmployee = async (req, res) => {
  try {
    const {
      fname, lastName, email, phoneNumber, dob, empCode,
      location, designation, department, date, salary
    } = req.body;

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
        addhar: req.files?.addhar ? req.files.addhar[0].filename : "",
        pan: req.files?.pan ? req.files.pan[0].filename : "",
        voterCard: req.files?.voterCard ? req.files.voterCard[0].filename : "",
        driving: req.files?.driving ? req.files.driving[0].filename : "",
      },
      bankVerification: {
        bankProof: req.files?.bankProof ? req.files.bankProof[0].filename : "",
      }
    });

    await newEmp.save();

    res.status(201).json({ message: "Employee added", data: newEmp });

  } catch (err) {
    res.status(400).json({ message: "Failed to add employee", error: err.message });
  }
};

// Get all employees
export const getAllEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const employees = await EmpData.find().skip(skip).limit(limit);
  

    res.status(200).json({
      
      message: "Paginated employees",
      data: employees,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch employees", error: err.message });
  }
};

// ✅ NEW: Add an asset to employee's assets array
export const addAssetToEmployee = async (req, res) => {
  try {
    const empId = req.params.id;
    const { asset } = req.body;

    if (!asset) {
      return res.status(400).json({ message: "Asset is required" });
    }

    const updated = await EmpData.findByIdAndUpdate(
      empId,
      { $push: { assets: asset } },  // 👉 push into array
      { new: true }
    );

    res.status(200).json({ message: "Asset added successfully", data: updated });
  } catch (err) {
    res.status(400).json({ message: "Failed to add asset", error: err.message });
  }
};


// Update employee by ID
export const updateEmployee = async (req, res) => {
  try {
    const emp = await EmpData.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    // Update fields
    Object.assign(emp, req.body);

    // Update files if uploaded
    if (req.files?.addhar) emp.backgroundVerification.addhar = req.files.addhar[0].filename;
    if (req.files?.pan) emp.backgroundVerification.pan = req.files.pan[0].filename;
    if (req.files?.voterCard) emp.backgroundVerification.voterCard = req.files.voterCard[0].filename;
    if (req.files?.driving) emp.backgroundVerification.driving = req.files.driving[0].filename;
    if (req.files?.bankProof) emp.bankVerification.bankProof = req.files.bankProof[0].filename;

    await emp.save();

    res.status(200).json({ message: "Employee updated", data: emp });

  } catch (err) {
    res.status(400).json({ message: "Failed to update employee", error: err.message });
  }
};

// Delete employee by ID
export const deleteEmployee = async (req, res) => {
  try {
    await EmpData.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Employee deleted" });
  } catch (err) {
    res.status(400).json({ message: "Failed to delete employee", error: err.message });
  }
};
