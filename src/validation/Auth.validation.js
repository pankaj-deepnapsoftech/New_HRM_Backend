import { string, object } from 'yup';

export const AuthValidation = object({
    fullName: string().min(2).max(30).required('Full Name is required field'),
    email: string().email().required('Email is required field'),
    phone: string().min(10).max(12).required('Phone No. is a required field'),
    username: string().min(2).required('username is required field'),
    password: string().min(6).max(16).required('Password is required field'),
    isMobile: string().required('isMobile is required field'),
    browser: string().required('Browser is required field'),
    role: string().required('Role is required field'),
});

export const LoginValidation = object({
    username: string().required('Username or Email is required field'),
    password: string().min(6).max(16).required('Password is required field'),
    isMobile: string().required('Device is required field'),
    browser: string().required('Device is required field'),
});
