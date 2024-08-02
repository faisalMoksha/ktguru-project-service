import { Request, NextFunction, Response } from "express";
import { Logger } from "winston";
import { Request as AuthRequest } from "express-jwt";
import createHttpError from "http-errors";
import { Roles } from "../../constants";
import { ApiCallService } from "../../services/apiCallService";
import { ProjectService } from "../../services/projectService";
import { SubSectionService } from "../../services/subSectionService";
import { ResourcesServices } from "../../services/resourcesService";
import { VerificationToken } from "../../types";

export class ResourcesController {
    constructor(
        private logger: Logger,
        private apiCallService: ApiCallService,
        private projectService: ProjectService,
        private subSectionService: SubSectionService,
        private resourcesService: ResourcesServices,
    ) {}

    add = async (req: Request, res: Response, next: NextFunction) => {
        //TODO:1. add userId in project chat
        //TODO:2. add userId in sub-setion chat if needed
        //TODO:3. check subscription
        //TODO:4. check resource limit
        //TODO:5. send mail

        const { name, email, message, projectId, subSectionIds, role } =
            req.body;

        this.logger.debug("New request to add resources", {
            name,
            email,
            message,
            projectId,
            subSectionIds,
            role,
        });

        try {
            const user = await this.apiCallService.addUser({
                email,
                role,
                projectId,
            });

            if (!user) {
                const error = createHttpError(400, "User not found");
                return next(error);
            }

            await this.projectService.addUserInProject(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                { userId: user.userId, projectId },
            );

            if (role == Roles.PROJECT_ADMIN) {
                await this.subSectionService.addUserInSubSection({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    userId: user.userId,
                    projectId: projectId,
                });
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (subSectionIds && subSectionIds.length > 0) {
                await this.subSectionService.bulkAdd(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    user.userId,
                    subSectionIds,
                );
            }

            res.status(201).json({
                message: "The recipient has been invited as per your request",
            });
        } catch (error) {
            return next(error);
            // return res.status(400).json(error);
        }
    };

    get = async (req: Request, res: Response) => {
        const projectId = req.params.id;

        const data = await this.projectService.getResources(projectId);

        //TODO: populate user data and send in response
        res.status(200).json({ resources: data?.resources });
    };

    getDetails = async (req: Request, res: Response, next: NextFunction) => {
        //TODO:1. Populate user data and send in response

        const { projectId, userId } = req.body;

        try {
            const result = await this.resourcesService.formatResources({
                userId,
                projectId,
            });

            res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    };

    remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { projectId, userId, removedFromAllProject } = req.body;

        if (!req.auth || !req.auth.sub) {
            return next(createHttpError(400, "Something went wrong"));
        }

        const userIdfromToken = req.auth.sub;

        if (userId == userIdfromToken) {
            return next(
                createHttpError(
                    400,
                    "You are unable to remove yourself from the project.",
                ),
            );
        }

        try {
            if (removedFromAllProject == true) {
                const project = await this.projectService.removedUser({
                    userId,
                    projectId,
                });

                await this.subSectionService.removedUser({ userId, projectId });

                return res.status(200).json({
                    message: "The user remove from project",
                    userId,
                    updatedProject: project,
                });
            } else {
                await this.subSectionService.removedUserFromOne({
                    userId,
                    projectId,
                });

                const result = await this.resourcesService.formatResources({
                    userId,
                    projectId,
                });

                res.status(200).json({
                    message: "The user remove from project",
                    result,
                    // allSubProjects, //TODO: check this
                });
            }
        } catch (error) {
            return next(error);
        }
    };

    addInSubSection = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const { projectId, userId, role } = req.body;

        try {
            const data =
                await this.subSectionService.addIUserInSingleSubSection({
                    userId,
                    projectId,
                    role,
                });

            if (!data) {
                const error = createHttpError(404, "Project not found");
                return next(error);
            }

            const result = await this.resourcesService.formatResources({
                userId,
                projectId: String(data?.projectId),
            });

            res.status(200).json({
                message: "TThe user added in sub section",
                result,
                // allSubProjects, //TODO: check this
            });
        } catch (error) {
            return next(error);
        }
    };

    addInCompany = async (req: Request, res: Response, next: NextFunction) => {
        //TODO:1. add userId in project chat
        //TODO:2. add userId in sub-setion chat if needed
        //TODO:3. check subscription pro or basic
        //TODO:4. check resource limit
        //TODO:5. send mail

        const { name, email, companyId, message } = req.body;

        this.logger.debug("New request to add resources", {
            name,
            email,
            companyId,
            message,
        });

        const role = Roles.COMPANY_ADMIN;

        try {
            const user = await this.apiCallService.addUser({
                email,
                role,
                companyId,
            });

            if (!user) {
                const error = createHttpError(400, "User not found");
                return next(error);
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const userId = user.userId;
            await this.projectService.AddCompanyManager(userId, companyId);

            res.status(200).json({
                message: "The recipient has been invited as per your request",
                // user: userObj, //TODO: check this
            });
        } catch (error) {
            return next(error);
        }
    };

    removeFromCompany = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const { companyId, userId } = req.body;

        try {
            const user = await this.apiCallService.removedFromCompany(
                companyId,
                userId,
            );

            if (!user) {
                const error = createHttpError(400, "User not found");
                return next(error);
            }

            await this.projectService.removedUserFromCompany(userId, companyId);

            res.status(200).json({
                message: "The user remove from company",
                // userObj, //TODO: check this
                // allProjectData,
            });
        } catch (error) {
            return next(error);
        }
    };

    verifyResource = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const token = req.params.token;

        try {
            const tokenData: VerificationToken =
                await this.apiCallService.getToken(token);

            if (!tokenData) {
                const error = createHttpError(
                    400,
                    "The link you followed seems to be incorrect or no longer active.",
                );
                return next(error);
            }

            //TODO:1. check subscription
            //TODO:2. check resource length

            await this.projectService.verifyResource({
                projectId: tokenData.projectId,
                userId: tokenData.userId,
            });

            //TODO:3. send token for redirect on home page
            //TODO:4. delete token
            res.status(200).json(tokenData);
        } catch (error) {
            return next(error);
        }
    };

    declineInvite = async (req: Request, res: Response, next: NextFunction) => {
        const token = req.params.token;

        try {
            const tokenData: VerificationToken =
                await this.apiCallService.getToken(token);

            if (!tokenData) {
                const error = createHttpError(
                    400,
                    "The link you followed seems to be incorrect or no longer active.",
                );
                return next(error);
            }

            //TODO:1. add mail send function
            //TODO:2. delete token

            res.status(200).json({
                sucess: true,
                message: "Declined invitaion",
            });
        } catch (error) {
            return next(error);
        }
    };

    signupUser = async (req: Request, res: Response, next: NextFunction) => {
        const { firstName, lastName, password } = req.body;

        const token = req.params.token;

        try {
            const tokenData: VerificationToken =
                await this.apiCallService.getToken(token);

            if (!tokenData) {
                const error = createHttpError(
                    400,
                    "The link you followed seems to be incorrect or no longer active.",
                );
                return next(error);
            }

            //TODO:1. check the resource limit

            const user = await this.apiCallService.signupUser({
                firstName,
                lastName,
                password,
                userId: tokenData.userId,
                companyId: tokenData.companyId ? tokenData.companyId : null,
            });

            if (!user) {
                const error = createHttpError(400, "User not found");
                return next(error);
            }

            if (tokenData.projectId) {
                await this.projectService.verifyResource({
                    projectId: tokenData.projectId,
                    userId: tokenData.userId,
                });
            }

            if (tokenData.companyId) {
                await this.projectService.verifyCompanyManager(
                    tokenData.userId,
                    tokenData.companyId,
                );
            }

            //TODO:2. delete token
            //TODO:2. prepare login credentials and send

            res.status(200).json({ success: true, message: "Done!" });
        } catch (error) {
            return next(error);
        }
    };
}
