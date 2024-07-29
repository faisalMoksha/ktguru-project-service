import express from "express";
// import { ResourcesController } from "../controllers/resources/resourcesController";
// import { asyncWrapper } from "../utils/wrapper";
// import authenticate from "../middlewares/authenticate";
// import { canAccess } from "../middlewares/canAccess";
// import { Roles } from "../constants";

const router = express.Router();

// const resourcesController = new ResourcesController();

// router.post(
//     "/",
//     authenticate,
//     canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN, Roles.PROJECT_ADMIN]),
//     asyncWrapper(resourcesController.add),
// );

export default router;
