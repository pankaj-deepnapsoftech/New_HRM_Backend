import { config } from "./config/env.config.js";

export const BackendUrl = config.NODE_ENV !== "development" ? config.BACKEND_URL : config.LOCAL_BACKEND_URL;
export const FileUrl = config.NODE_ENV !== "development" ? config.FILE_URL : config.LOCAL_FILE_URL