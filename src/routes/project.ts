import express from "express";
import { asyncWrapper } from "../utils/wrapper";
import { ProjectController } from "../controllers/project/projectController";
import authenticate from "../middlewares/authenticate";
import { canAccess } from "../middlewares/canAccess";
import { Roles } from "../constants";
import logger from "../config/logger";
import projectValidator from "../validators/project-validator";
import updateProjectValidator from "../validators/update-project-validator";
import { ProjectService } from "../services/projectService";

const router = express.Router();

const projectService = new ProjectService();
const projectController = new ProjectController(logger, projectService);

// create project
router.post(
    "/",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN]),
    projectValidator,
    asyncWrapper(projectController.create),
);

// update project
router.patch(
    "/:id",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN]),
    updateProjectValidator,
    asyncWrapper(projectController.update),
);

// get all projects
router.get("/", authenticate, asyncWrapper(projectController.getAll));

// get single project
router.get("/:id", authenticate, asyncWrapper(projectController.getOne));

export default router;
