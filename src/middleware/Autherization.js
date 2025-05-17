import { logger } from "../utils/Logger.js"
import { VerifyToken } from "../utils/TokenGenerator.js";
import { UserModel } from "../models/UserModel.js";
import { UnauthorizedError } from "../utils/CustomError.js";


export const Autherization = async(req,_res,next) => {
    try {
        const {ajt} = req.cookies || req.headers?.authorization?.split(' ')[1];
        const {email} = VerifyToken(ajt);
        const user = await UserModel.findOne({email}).select("fullName email phone username employeeId");
        if(!user){
            next(new UnauthorizedError("User Not Autherized","Autherization methord"))
        }
        req.CurrentUser = user;
        next()
    } catch (error) {
      logger.error(error)
    }
}


