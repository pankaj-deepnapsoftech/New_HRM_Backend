import { Router } from 'express';
import { Autherization } from "../middleware/Autherization.js";
import { getAllProjectsWithPagination, createProjects } from '../controllers/ProjectController.js';
import { Validater } from '../helper/Validator.js';
import { ProjectValidation } from '../validation/Project.validation.js';

const 	router = Router();

router.route("/").get(Autherization, getAllProjectsWithPagination);
router.route("/").post(Autherization, Validater(ProjectValidation));

export default router;
