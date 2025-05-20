/* eslint-disable no-undef */
import dotenv from "dotenv";
dotenv.config();

class Config {
    NODE_ENV;
    LOCAL_CLIENT_URL;
    CLIENT_URL;
    JWT_SECRET;
    FILE_URL;
    MONGODB_URI;
    EMAIL_ID;
    EMAIL_PASSWORD;
    BACKEND_URL;
    LOCAL_BACKEND_URL;
    constructor() {
        this.NODE_ENV = process.env.NODE_ENV;
        this.LOCAL_CLIENT_URL = process.env.LOCAL_CLIENT_URL;
        this.CLIENT_URL = process.env.CLIENT_URL;
        this.JWT_SECRET = process.env.JWT_SECRET;
        this.FILE_URL = process.env.FILE_URL;
        this.MONGODB_URI = process.env.MONGODB_URI;
        this.EMAIL_ID = process.env.EMAIL_ID;
        this.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
        this.BACKEND_URL = process.env.BACKEND_URL;
        this.LOCAL_BACKEND_URL = process.env.LOCAL_BACKEND_URL;
    };
};

export const config = new Config();