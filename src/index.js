import express from 'express';
import { StartServer } from './server.js';
import { logger } from './utils/Logger.js';
import { DbConnection } from './connections/DbConnection.js';

const SERVER_PORT = 8075;

const Initserver = () => {
    const app = express();
    StartServer(app);
    DbConnection();

    app.listen(SERVER_PORT, () => {
        logger.info(`Server is up and Running on port : ${SERVER_PORT}`);
    });
};

Initserver();
