import { StatusCodes } from "http-status-codes";
import { FileUrl } from "../constant.js";
import { EmployeeModel } from "../models/Employee.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { NotFoundError } from "../utils/CustomError.js";
import { UserModel } from "../models/UserModel.js";
import EmpData from "../models/EmpDataModel.js";



export const CreateEmployeeDetail = AsyncHandler(async (req, res) => {
    const { body, files } = req;

    if (!files?.aadhaar) {
        throw new NotFoundError("Aadhaar Card image not found", "CreateEmployeeDetail method");
    }

    if (!files?.photo) {
        throw new NotFoundError("Photo not found", "CreateEmployeeDetail method");
    }

    if (!files?.pancard) {
        throw new NotFoundError("Pancard Proof not found", "CreateEmployeeDetail method");
    }

    if (!files?.Bank_Proof) {
        throw new NotFoundError("Bank Proof not found", "CreateEmployeeDetail method");
    }

    const aadhaar = `${FileUrl}/${files.aadhaar[0].filename}`;
    const photo = `${FileUrl}/${files.photo[0].filename}`;
    const pancard = `${FileUrl}/${files.pancard[0].filename}`;
    const Bank_Proof = `${FileUrl}/${files.Bank_Proof[0].filename}`;
    const Voter_Id = files?.Voter_Id &&  `${FileUrl}/${files.Voter_Id[0].filename}`;
    const Driving_Licance = files?.Driving_Licance && `${FileUrl}/${files.Driving_Licance[0].filename}`;

    // Optionally create a login user for the employee if email/password provided
    let employeeUserId = req?.CurrentUser?._id;
    const empEmail = body?.empEmail;
    const empPassword = body?.empPassword;
    const empFullName = body?.empFullName || body?.fullName;
    const empPhone = body?.empPhone || body?.phone;

    if (empEmail && empPassword) {
        const username = (empEmail.split("@")[0] || "employee").toLowerCase();
        const exist = await UserModel.findOne({ $or: [{ email: empEmail }, { username }] });
        if (!exist) {
            const userDoc = await UserModel.create({
                fullName: empFullName || username,
                email: empEmail,
                phone: empPhone || "0000000000",
                username,
                password: empPassword,
                role: "User",
                verification: true,
            });
            employeeUserId = userDoc._id;
        } else {
            employeeUserId = exist._id;
        }
    }

    const result = await EmployeeModel.create({
        ...body,
        aadhaar,
        photo,
        pancard,
        Bank_Proof,
        Voter_Id,
        Driving_Licance,
        Emp_id: employeeUserId
    });

    // Also create minimal EmpData record so it reflects in EmpDashboard
    try {
        await EmpData.create({
            fname: empFullName || body?.fname || "",
            email: empEmail || "",
            department: body?.Department || "",
            designation: body?.Designation || "",
            salary: body?.salary || 0,
            date: new Date().toISOString(),
            empCode: body?.empCode || "",
            location: body?.Address || "",
          });
    } catch (e) {
        // non-blocking
    }
 
    return res.status(StatusCodes.CREATED).json({
        message: "Employee data Uploaded",
        data: result
    });

});


export const UpdateEmployeeDetail = AsyncHandler(async (req, res) => {
    const { body, files } = req;
    const employeeId = req.params.id;

    const existingEmployee = await EmployeeModel.findById(employeeId);
    if (!existingEmployee) {
        throw new NotFoundError("Employee not found", "UpdateEmployeeDetail method");
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
        message: "Employee data updated successfully",
        data: updatedEmployee
    });
});

export const DeleteEmployeeDetail = AsyncHandler(async (req, res) => {
    const employeeId = req.params.id;

    const deletedEmployee = await EmployeeModel.findByIdAndDelete(employeeId);

    if (!deletedEmployee) {
        throw new NotFoundError("Employee not found", "DeleteEmployeeDetail method");
    }

    return res.status(StatusCodes.OK).json({
        message: "Employee deleted successfully",
        data: deletedEmployee
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
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }), // Optional: sort by latest
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
    const employeesList = await EmployeeModel.aggregate([{
    $lookup: {
      from: "users",
      localField: "Emp_id",
      foreignField: "_id",
      as: "userDetails"
    }
  },
  {
    $unwind: "$userDetails"
  },
  {
    $project: {
      Emp_id: 1,
      fullName: "$userDetails.fullName",
    }
  }]);
    
    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Data fetched successfully",
        data: employeesList
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
    const employeesList = await EmployeeModel.find({}).populate("Emp_id", "fullName email employeeId").select("Address Department Designation").lean();

    const flattendList = employeesList.map((emp) => ({
        ...emp,
        fullName: emp.Emp_id?.fullName,
        email: emp.Emp_id?.email,
        employeeId: emp.Emp_id?.employeeId
    }));
    delete flattendList.Emp_id;

    flattendList.map(emp => delete emp.Emp_id);

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Data fetched successfully",
        data: flattendList
    });
});
