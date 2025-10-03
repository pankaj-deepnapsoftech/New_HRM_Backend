import express, { json, urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { StatusCodes } from 'http-status-codes';
import path from 'path';
import { fileURLToPath } from 'url';

// local imports
import { config } from './config/env.config.js';
import RootRouter from './routes/Routes.js';
import { CustomError } from './utils/CustomError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const StartServer = (app) => {
    app.set('trust proxy', 1);
    app.use(json({ limit: '10mb' }));
    app.use(urlencoded({ extended: true, limit: '10mb' }));
    app.use(
        cors({
            origin:
                config.NODE_ENV === 'development'
                    ? config.LOCAL_CLIENT_URL
                    : config.CLIENT_URL,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTION'],
            credentials: true,
        })
    );
    app.use(cookieParser());

    app.get('/health', (_req, res) => {
        res.send('Server is running and healthy');
    });

    app.use('/api/v1', RootRouter);
    app.use(
        '/file',
        express.static(path.join(__dirname, '../', 'public/temp'))
    );

    app.use((error, _req, res, next) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json(error.serializeErrors());
        } else if (error.message === 'jwt expired') {
            const filepath = path.join(__dirname, '../notfound.html');
            res.sendFile(filepath);
        } else {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: error.message || 'somthing went Wrong',
                status: 'error',
                error: error.name,
            });
        }
        next();
    });

    // app.all('/*', (req, _res, next) => {
    //     throw new BadGateway(`Can't find ${req.protocol}://${req.get('host')}${req.originalUrl} on this server!`, 'Server file Error line no 26');
    // });
};
