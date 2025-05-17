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
    constructor(){
        this.NODE_ENV = process.env.NODE_ENV;
        this.LOCAL_CLIENT_URL = process.env.LOCAL_CLIENT_URL;
        this.CLIENT_URL = process.env.CLIENT_URL;
        this.JWT_SECRET = process.env.JWT_SECRET;
        this.FILE_URL = process.env.FILE_URL;
        this.MONGODB_URI = process.env.MONGODB_URI;
    };
};

export const config = new Config();