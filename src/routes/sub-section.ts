import express from "express";
import { asyncWrapper } from "../utils/wrapper";
import authenticate from "../middlewares/authenticate";
import logger from "../config/logger";
import { SubSectionController } from "../controllers/project/subSectionController";
import projectValidator from "../validators/project-validator";
import updateProjectValidator from "../validators/update-project-validator";
import { SubSectionService } from "../services/subSectionService";
import { createMessageBroker } from "../utils/factories/brokerFactory";
import { ProjectService } from "../services/projectService";

const router = express.Router();

const subSectionService = new SubSectionService();
const projectService = new ProjectService();
const broker = createMessageBroker();

const subSectionController = new SubSectionController(
    logger,
    subSectionService,
    projectService,
    broker,
);

/**
 * create sub section endpoint
 */
router.post(
    "/",
    authenticate,
    projectValidator,
    asyncWrapper(subSectionController.create),
);

/**
 * update sub section endpoint
 */
router.patch(
    "/:id",
    authenticate,
    updateProjectValidator,
    asyncWrapper(subSectionController.update),
);

/**
 * get all sub section endpoint
 */
router.get("/:id", authenticate, asyncWrapper(subSectionController.getAll));

/**
 * get single sub section endpoint
 */
router.get(
    "/single/:id",
    authenticate,
    asyncWrapper(subSectionController.getOne),
);

export default router;
