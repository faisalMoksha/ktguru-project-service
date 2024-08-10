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

/**
 * add resoure endpoint
 */
router.post(
    "/",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.add),
);

/**
 * get resoure endpoint
 */
router.get(
    "/:id",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.get),
);

/**
 * get resoure details endpoint
 */
router.post(
    "/detail",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.getDetails),
);

/**
 * add in subsection endpoint
 */
router.post(
    "/add-in-subsection",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.addInSubSection),
);

/**
 * remove resource from project endpoint
 */
router.post(
    "/remove",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.remove),
);

/**
 * add resource in company as admin endpoint
 */
router.post(
    "/add-company-admin",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.addInCompany),
);

/**
 * remove company admin resource endpoint
 */
router.post(
    "/remove-company",
    authenticate,
    canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
    asyncWrapper(resourcesController.removeFromCompany),
);

/**
 * signup resource endpoint
 */
router.post("/signup/:token", asyncWrapper(resourcesController.signupUser));

/**
 * verify resource request endpoint
 */
router.get("/verify/:token", asyncWrapper(resourcesController.verifyResource));

/**
 * decline resource request endpoint
 */
router.get("/decline/:token", asyncWrapper(resourcesController.declineInvite));

export default router;
