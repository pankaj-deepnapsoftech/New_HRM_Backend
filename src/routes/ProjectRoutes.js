// import { Router } from 'express';
// import { Autherization } from "../middleware/Autherization.js";
// import { getAllProjectsWithPagination, createProjects } from '../controllers/ProjectController.js';
// import { Validater } from '../helper/Validator.js';
// import { ProjectValidation } from '../validation/Project.validation.js';

// const 	router = Router();

// router.route("/").get(Autherization, getAllProjectsWithPagination);
// router.route("/").post(Autherization, Validater(ProjectValidation), createProjects);

// export default router;

import express from 'express';
import {
    getAllProjects,
    createProjects,
    deleteProject,
} from '../controllers/ProjectController.js';

const router = express.Router();

router.get('/', getAllProjects);
router.post('/', createProjects);
router.delete('/:id', deleteProject);

export default router;
