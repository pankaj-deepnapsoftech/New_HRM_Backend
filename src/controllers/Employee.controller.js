import { StatusCodes } from 'http-status-codes';
import { FileUrl } from '../constant.js';
import { EmployeeModel } from '../models/Employee.model.js';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import { NotFoundError } from '../utils/CustomError.js';
import { UserModel } from '../models/UserModel.js';
import EmpData from '../models/EmpDataModel.js';

export const CreateEmployeeDetail = AsyncHandler(async (req, res) => {
    const { body, files } = req;

    // 🔹 Required file validations
    if (!files?.aadhaar) {
        throw new NotFoundError(
            'Aadhaar Card image not found',
            'CreateEmployeeDetail method'
        );
    }
    if (!files?.photo) {
        throw new NotFoundError(
            'Photo not found',
            'CreateEmployeeDetail method'
        );
    }
    if (!files?.pancard) {
        throw new NotFoundError(
            'Pancard Proof not found',
            'CreateEmployeeDetail method'
        );
    }
    if (!files?.Bank_Proof) {
        throw new NotFoundError(
            'Bank Proof not found',
            'CreateEmployeeDetail method'
        );
    }

    // 🔹 Prepare file paths
    const aadhaar = `${FileUrl}/${files.aadhaar[0].filename}`;
    const photo = `${FileUrl}/${files.photo[0].filename}`;
    const pancard = `${FileUrl}/${files.pancard[0].filename}`;
    const Bank_Proof = `${FileUrl}/${files.Bank_Proof[0].filename}`;
    const Voter_Id =
        files?.Voter_Id && `${FileUrl}/${files.Voter_Id[0].filename}`;
    const Driving_Licance =
        files?.Driving_Licance &&
        `${FileUrl}/${files.Driving_Licance[0].filename}`;

    const Emp_id = body?._id;

    if (!Emp_id) {
        throw new NotFoundError(
            'Emp_id not provided',
            'CreateEmployeeDetail method'
        );
    }

    const empData = await EmpData.findById(Emp_id).select("empCode fname ");
    
    if (!empData) {
        throw new NotFoundError(
            'EmpData not found for provided Emp_id',
            'CreateEmployeeDetail method'
        );
    }

    const result = await EmployeeModel.create({
        ...body,
        empCode: empData.empCode,
        aadhaar,
        photo,
        pancard,
        Bank_Proof,
        Voter_Id,
        Driving_Licance,
        Emp_id,
    });

    await EmpData.findByIdAndUpdate(Emp_id, {
        verificationDetails: result._id,
    });

    return res.status(StatusCodes.CREATED).json({
        message: 'Employee data Uploaded',
        data: result,
    });
});

export const UpdateEmployeeDetail = AsyncHandler(async (req, res) => {
    const { body, files } = req;
    const employeeId = req.params.id;

    const existingEmployee = await EmployeeModel.findById(employeeId);
    if (!existingEmployee) {
        throw new NotFoundError(
            'Employee not found',
            'UpdateEmployeeDetail method'
        );
    }

    // Prepare updated fields
    const updates = { ...body };

    if (files?.aadhaar) {
        updates.aadhaar = `${FileUrl}/${files.aadhaar[0].filename}`;
    }

    if (files?.photo) {
        updates.photo = `${FileUrl}/${files.photo[0].filename}`;
    }

    if (files?.pancard) {
        updates.pancard = `${FileUrl}/${files.pancard[0].filename}`;
    }

    if (files?.Bank_Proof) {
        updates.Bank_Proof = `${FileUrl}/${files.Bank_Proof[0].filename}`;
    }

    if (files?.Voter_Id) {
        updates.Voter_Id = `${FileUrl}/${files.Voter_Id[0].filename}`;
    }

    if (files?.Driving_Licance) {
        updates.Driving_Licance = `${FileUrl}/${files.Driving_Licance[0].filename}`;
    }

    // Update the employee data
    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
        employeeId,
        updates,
        { new: true } // return the updated document
    );

    return res.status(StatusCodes.OK).json({
        message: 'Employee data updated successfully',
        data: updatedEmployee,
    });
});

export const DeleteEmployeeDetail = AsyncHandler(async (req, res) => {
    const employeeId = req.params.id;

    const deletedEmployee = await EmployeeModel.findByIdAndDelete(employeeId);

    if (!deletedEmployee) {
        throw new NotFoundError(
            'Employee not found',
            'DeleteEmployeeDetail method'
        );
    }

    await EmpData.findByIdAndUpdate(deletedEmployee.Emp_id, { verificationDetails: null });

    return res.status(StatusCodes.OK).json({
        message: 'Employee deleted successfully',
        data: deletedEmployee,
    });
});

export const ListEmployeesWithPagination = AsyncHandler(async (req, res) => {
    let { page = 1, limit = 10 } = req.query;

    // Convert to numbers
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // Fetch paginated employees
const [employees, total] = await Promise.all([
    EmployeeModel.find()
        .populate({
            path: "Emp_id",
            select: "empCode fname " 
        })
      
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
    EmployeeModel.countDocuments()
]);


    const totalPages = Math.ceil(total / limit);

    return res.status(StatusCodes.OK).json({
        message: "Employee list retrieved successfully",
        data: employees,
        pagination: {
            total,
            page,
            totalPages,
            limit
        }
    });
}); 


export const getEmployeeNamesOnly = AsyncHandler(async (req, res) => {
    const employeesList = await EmployeeModel.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'Emp_id',
                foreignField: '_id',
                as: 'userDetails',
            },
        },
        {
            $unwind: '$userDetails',
        },
        {
            $project: {
                Emp_id: 1,
                fullName: '$userDetails.fullName',
            },
        },
    ]);

    return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Data fetched successfully',
        data: employeesList,
    });
});

export const getEmployeesReport = AsyncHandler(async (req, res) => {
    // const employeesList = await EmployeeModel.find({}).populate("Emp_id", "fullName email").select("Address Department Designation salary");
    // employeesList.map((emp) => ({
    //     ...emp,
    //     fullName: emp.Emp_id?.fullName,
    //     email: emp.Emp_id?.email
    // }));
    // return res.status(StatusCodes.OK).json({
    //     success: true,
    //     message: "Data fetched successfully",
    //     data: employeesList
    // });
});

export const getEmployeesLocations = AsyncHandler(async (req, res) => {
    const employeesList = await EmployeeModel.find({})
        .populate('Emp_id', 'fullName email employeeId')
        .select('Address Department Designation')
        .lean();

    const flattendList = employeesList.map((emp) => ({
        ...emp,
        fullName: emp.Emp_id?.fullName,
        email: emp.Emp_id?.email,
        employeeId: emp.Emp_id?.employeeId,
    }));
    delete flattendList.Emp_id;

    flattendList.map((emp) => delete emp.Emp_id);

    return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Data fetched successfully',
        data: flattendList,
    });
});

export const GetEmployeeDocumentDetailById = AsyncHandler(async (req, res) => {
    const employeeId = req.params.id;

  
    const employee = await EmployeeModel.findById(employeeId)
        .populate("Emp_id", "fullName email employeeId") 
        .lean();

    if (!employee) {
        throw new NotFoundError("Employee not found", "GetEmployeeDocumentDetailById method");
    }

    
    const result = {
        ...employee,
        fullName: employee.Emp_id?.fullName,
        email: employee.Emp_id?.email,
        employeeId: employee.Emp_id?.employeeId,
    };

    delete result.Emp_id;

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Employee detail fetched successfully",
        data: result,
    });
});
