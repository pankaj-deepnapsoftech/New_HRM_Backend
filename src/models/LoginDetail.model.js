import { Schema, model } from "mongoose";

const LoginDetailSchema = new Schema({
    isMobile: { type: Boolean, required: true },
    browser: { type: String, required: true },
    userIp: { type: String, required: true },
    userId:{type:Schema.Types.ObjectId,ref:"Users",required:true}
}, { timestamps: true });



export const LoginModel = model("LoginDetail", LoginDetailSchema)


