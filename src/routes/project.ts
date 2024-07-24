import express from "express";
// import { asyncWrapper } from "../utils/wrapper";
// import { ProjectController } from "../controllers/project/projectController";
// import authenticate from "../middlewares/authenticate";
// import { canAccess } from "../middlewares/canAccess";
// import { Roles } from "../constants";

const router = express.Router();

// const projectController = new ProjectController();

// router.post(
//     "/create",
//     authenticate,
//     canAccess([Roles.COMPANY, Roles.COMPANY_ADMIN]),
//     asyncWrapper(projectController.create),
// );

export default router;
