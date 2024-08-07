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

const router = express.Router();

const subSectionService = new SubSectionService();
const subSectionController = new SubSectionController(
    logger,
    subSectionService,
);

// create sub section
router.post(
    "/",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    projectValidator,
    asyncWrapper(subSectionController.create),
);

// update sub section
router.patch(
    "/:id",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    updateProjectValidator,
    asyncWrapper(subSectionController.update),
);

// get all sub section
router.get("/:id", authenticate, asyncWrapper(subSectionController.getAll));

// get sub section
router.get(
    "/single/:id",
    authenticate,
    asyncWrapper(subSectionController.getOne),
);

export default router;
