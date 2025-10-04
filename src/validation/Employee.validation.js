import {string,object,number} from "yup";



export const EmployeeValidation = object({
    // Address:string().required("Address is required field"),
    // Department:string().required("Department is required field"),
    // Designation:string().required("Designation is required field"),
    UAN_number:string().required("UAN Number is required field"),
    Bank_Account:string().required("Bank Account is required field"),
    Back_Name:string().required("Back Name is required field"),
    IFSC_Code:string().required("IFSC Codeis required field"),
    // salary:number().required("Salary is required field"),
});




