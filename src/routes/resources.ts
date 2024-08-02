import express from "express";
import { ResourcesController } from "../controllers/resources/resourcesController";
import { asyncWrapper } from "../utils/wrapper";
import authenticate from "../middlewares/authenticate";
import { canAccess } from "../middlewares/canAccess";
import { Roles } from "../constants";
import logger from "../config/logger";
import { ApiCallService } from "../services/apiCallService";
import { ProjectService } from "../services/projectService";
import { SubSectionService } from "../services/subSectionService";
import { ResourcesServices } from "../services/resourcesService";

const router = express.Router();

const apiCallService = new ApiCallService();
const projectService = new ProjectService();
const subSectionService = new SubSectionService();
const resourcesService = new ResourcesServices();

const resourcesController = new ResourcesController(
    logger,
    apiCallService,
    projectService,
    subSectionService,
    resourcesService,
);

router.post(
    "/",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.add),
);

router.get(
    "/:id",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.get),
);

router.post(
    "/detail",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.getDetails),
);

router.post(
    "/remove",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.remove),
);

router.post(
    "/add-sub-section",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.addInSubSection),
);

router.post(
    "/add-company",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.addInCompany),
);

router.post(
    "/remove-company",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.removeFromCompany),
);

router.get("/verify/:token", asyncWrapper(resourcesController.verifyResource));

router.get("/decline/:token", asyncWrapper(resourcesController.declineInvite));

router.post("/signup/:token", asyncWrapper(resourcesController.signupUser));

export default router;
