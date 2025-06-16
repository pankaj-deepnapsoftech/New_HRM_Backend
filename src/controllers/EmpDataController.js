// src/controllers/EmpDataController.js
import EmpData from "../models/EmpDataModel.js";

// Create new employee
export const addEmployee = async (req, res) => {
  try {
    const employee = new EmpData(req.body);
    await employee.save();
    res.status(201).json({ message: "Employee added", data: employee });
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
    const updated = await EmpData.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "Employee updated", data: updated });
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
