import { StatusCodes } from 'http-status-codes';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import { NotFoundError, BadRequestError } from '../utils/CustomError.js';
import Designation from '../models/DesignationModel.js';

// Create designation
export const createDesignation = AsyncHandler(async (req, res) => {
    const { designationName, description } = req.body;

    if (!designationName) {
        throw new BadRequestError('Designation name is required', 'createDesignation');
    }

    // Check if designation already exists
    const existingDesignation = await Designation.findOne({ 
        designationName: { $regex: new RegExp(`^${designationName}$`, 'i') } 
    });

    if (existingDesignation) {
        throw new BadRequestError('Designation already exists', 'createDesignation');
    }

    const designation = await Designation.create({
        designationName: designationName.trim(),
        description: description?.trim() || ''
    });

    res.status(StatusCodes.CREATED).json({
        message: 'Designation created successfully',
        data: designation
    });
});

// Get all designations
export const getAllDesignations = AsyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, isActive } = req.query;

    const query = {};
    
    if (search) {
        query.designationName = { $regex: search, $options: 'i' };
    }
    
    if (isActive !== undefined && isActive !== '') {
        query.isActive = `${isActive}` === 'true';
    }

    const designations = await Designation.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit));

    const total = await Designation.countDocuments(query);

    res.status(StatusCodes.OK).json({
        message: 'Designations retrieved successfully',
        data: designations,
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalDesignations: total
        }
    });
});

// Get all active designations (for dropdowns)
export const getActiveDesignations = AsyncHandler(async (req, res) => {
    const designations = await Designation.find({ isActive: true })
        .select('designationName')
        .sort({ designationName: 1 });

    res.status(StatusCodes.OK).json({
        message: 'Active designations retrieved successfully',
        data: designations
    });
});

// Get designation by ID
export const getDesignationById = AsyncHandler(async (req, res) => {
    const { id } = req.params;

    const designation = await Designation.findById(id);
    if (!designation) {
        throw new NotFoundError('Designation not found', 'getDesignationById');
    }

    res.status(StatusCodes.OK).json({
        message: 'Designation retrieved successfully',
        data: designation
    });
});

// Update designation
export const updateDesignation = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { designationName, description, isActive } = req.body;

    const designation = await Designation.findById(id);
    if (!designation) {
        throw new NotFoundError('Designation not found', 'updateDesignation');
    }

    // Check if new name conflicts with existing designation
    if (designationName && designationName !== designation.designationName) {
        const existingDesignation = await Designation.findOne({ 
            designationName: { $regex: new RegExp(`^${designationName}$`, 'i') },
            _id: { $ne: id }
        });

        if (existingDesignation) {
            throw new BadRequestError('Designation name already exists', 'updateDesignation');
        }
    }

    const updateData = {};
    if (designationName) updateData.designationName = designationName.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedDesignation = await Designation.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(StatusCodes.OK).json({
        message: 'Designation updated successfully',
        data: updatedDesignation
    });
});

// Delete designation
export const deleteDesignation = AsyncHandler(async (req, res) => {
    const { id } = req.params;

    const designation = await Designation.findById(id);
    if (!designation) {
        throw new NotFoundError('Designation not found', 'deleteDesignation');
    }

    // Check if designation is being used by any employee
    const EmpData = (await import('../models/EmpDataModel.js')).default;
    const employeeUsingDesignation = await EmpData.findOne({ designation: designation.designationName });
    
    if (employeeUsingDesignation) {
        throw new BadRequestError('Cannot delete designation. It is being used by employees.', 'deleteDesignation');
    }

    await Designation.findByIdAndDelete(id);

    res.status(StatusCodes.OK).json({
        message: 'Designation deleted successfully'
    });
});

// Toggle designation status
export const toggleDesignationStatus = AsyncHandler(async (req, res) => {
    const { id } = req.params;

    const designation = await Designation.findById(id);
    if (!designation) {
        throw new NotFoundError('Designation not found', 'toggleDesignationStatus');
    }

    designation.isActive = !designation.isActive;
    await designation.save();

    res.status(StatusCodes.OK).json({
        message: `Designation ${designation.isActive ? 'activated' : 'deactivated'} successfully`,
        data: designation
    });
});
