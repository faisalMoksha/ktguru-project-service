import express from "express";
import { asyncWrapper } from "../utils/wrapper";
import authenticate from "../middlewares/authenticate";
import { canAccess } from "../middlewares/canAccess";
import { Roles } from "../constants";
import logger from "../config/logger";
import { SubSectionController } from "../controllers/project/subSectionController";
import projectValidator from "../validators/project-validator";
import updateProjectValidator from "../validators/update-project-validator";
import { SubSectionService } from "../services/subSectionService";
import { createMessageBroker } from "../utils/factories/brokerFactory";

const router = express.Router();

const subSectionService = new SubSectionService();
const broker = createMessageBroker();

const subSectionController = new SubSectionController(
    logger,
    subSectionService,
    broker,
);

/**
 * create sub section endpoint
 */
router.post(
    "/",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    projectValidator,
    asyncWrapper(subSectionController.create),
);

/**
 * update sub section endpoint
 */
router.patch(
    "/:id",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
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
