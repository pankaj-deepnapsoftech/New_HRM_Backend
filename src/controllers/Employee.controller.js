import { StatusCodes } from "http-status-codes";
import { FileUrl } from "../constant.js";
import { EmployeeModel } from "../models/Employee.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { NotFoundError } from "../utils/CustomError.js";



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

    const result = await EmployeeModel.create({ ...body, aadhaar, photo, pancard,Bank_Proof,Voter_Id,Driving_Licance,Emp_id:req?.CurrentUser?._id });

    return res.status(StatusCodes.CREATED).json({
        message: "Employee data Uploaded",
        data: result
    });

});



