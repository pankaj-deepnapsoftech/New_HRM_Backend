import { StatusCodes } from "http-status-codes";
import { FileUrl } from "../constant.js";
import { EmployeeModel } from "../models/Employee.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";



export const CreateEmployeeDetail = AsyncHandler(async (req,res) => {
    const {body,files} = req;

    const aadhaar = `${FileUrl}/${files.aadhaar[0].filename}`
    const photo = `${FileUrl}/${files.photo[0].filename}`
    const pancard = `${FileUrl}/${files.pancard[0].filename}`

    const result = await EmployeeModel.create({...body,aadhaar,photo,pancard});

    return res.status(StatusCodes.CREATED).json({
        message:"Employee data Uploaded",
        data:result
    })

});



