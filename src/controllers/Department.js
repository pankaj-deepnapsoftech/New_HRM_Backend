
import { DepartmentModel } from "../models/DepartmentModal.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";


export const CreateDepartment = AsyncHandler(async (req, res) => {
    const { department_name, sub_department } = req.body;
    

    const newDepartment = await DepartmentModel.create({ department_name, sub_department, adminId: req?.CurrentUser?._id });


    res.status(201).json({
        success: true,
        message: "Department created successfully",
        data: newDepartment,
    });
});


export const GetAllDepartments = AsyncHandler(async (req, res) => {
    const isSuperAdmin = req?.CurrentUser?.role === 'SuperAdmin';
    const adminId = isSuperAdmin && req.query.adminId ? req.query.adminId : req?.CurrentUser?._id;
    const departments = await DepartmentModel.find({ adminId });

    res.status(200).json({
        success: true,
        data: departments,
    });
});

export const GetDepartmentById = AsyncHandler(async (req, res) => {
    const { id } = req.params;

    const department = await DepartmentModel.findById(id);

    if (!department) {
        return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({
        success: true,
        data: department,
    });
});


export const UpdateDepartment = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { department_name, sub_department } = req.body;

    const updatedDepartment = await DepartmentModel.findByIdAndUpdate(
        id,
        { department_name, sub_department },
        { new: true, runValidators: true }
    );

    if (!updatedDepartment) {
        return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({
        success: true,
        message: "Department updated successfully",
        data: updatedDepartment,
    });
});


export const DeleteDepartment = AsyncHandler(async (req, res) => {
    const { id } = req.params;

    const deleted = await DepartmentModel.findByIdAndDelete(id);

    if (!deleted) {
        return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({
        success: true,
        message: "Department deleted successfully",
    });
});
