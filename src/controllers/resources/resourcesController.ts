import { Request, NextFunction, Response } from "express";
import { Logger } from "winston";
import { Request as AuthRequest } from "express-jwt";
import createHttpError from "http-errors";
import {
    ChatEvents,
    KafKaTopic,
    ResourcesStatus,
    Roles,
} from "../../constants";
import { ApiCallService } from "../../services/apiCallService";
import { ProjectService } from "../../services/projectService";
import { SubSectionService } from "../../services/subSectionService";
import { ResourcesServices } from "../../services/resourcesService";
import { VerificationToken } from "../../types";
import { MessageBroker } from "../../types/broker";

export class ResourcesController {
    constructor(
        private logger: Logger,
        private apiCallService: ApiCallService,
        private projectService: ProjectService,
        private subSectionService: SubSectionService,
        private resourcesService: ResourcesServices,
        private broker: MessageBroker,
    ) {}

    add = async (req: AuthRequest, res: Response, next: NextFunction) => {
        //TODO:1. Check subscription
        //TODO:2. Check resource limit
        //TODO:3. Send mail

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

        if (!req.auth || !req.auth.sub) {
            return next(createHttpError(400, "Something went wrong"));
        }

        const addedBy = req.auth.sub;

        try {
            const user: { userId: string } = await this.apiCallService.addUser({
                email,
                role,
                projectId,
                addedBy,
            });

            if (!user) {
                const error = createHttpError(400, "User not found");
                return next(error);
            }

            await this.projectService.addUserInProject({
                userId: user.userId,
                projectId,
                role,
            });

            let getProjectIds: string[] = [];

            if (role == Roles.PROJECT_ADMIN) {
                await this.subSectionService.addUserInSubSection({
                    userId: user.userId,
                    projectId: projectId,
                });

                const ids = await this.subSectionService.getSubsectionIds([
                    projectId,
                ]);

                getProjectIds = ids;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (subSectionIds && subSectionIds.length > 0) {
                await this.subSectionService.bulkAdd(
                    user.userId,
                    subSectionIds,
                );

                getProjectIds = subSectionIds;
            }

            getProjectIds.push(projectId);

            // send kafka message
            const brokerMessage = {
                event_type: ChatEvents.ADD_USER_PROJECT_CHAT,
                data: {
                    userId: user.userId,
                    isApproved: false,
                    getProjectIds: getProjectIds,
                },
            };

            await this.broker.sendMessage(
                KafKaTopic.Chat,
                JSON.stringify(brokerMessage),
                projectId,
            );

            res.status(201).json({
                message: "The recipient has been invited as per your request",
            });
        } catch (error) {
            return next(error);
        }
    };

    get = async (req: Request, res: Response) => {
        const projectId = req.params.id;

        const data = await this.projectService.getResources(projectId);

        res.status(200).json(data);
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
                    status: ResourcesStatus.REMOVED_BY_ADMIN,
                });

                await this.subSectionService.removedUser({ userId, projectId });

                return res.status(200).json({
                    message: "The user remove from project",
                    userId,
                    updatedProject: project,
                });
            } else {
                const subsection =
                    await this.subSectionService.removedUserFromOne({
                        userId,
                        projectId,
                    });

                // prepare projectId
                const id = subsection ? String(subsection.projectId) : "";
                const result = await this.resourcesService.formatResources({
                    userId,
                    projectId: id,
                });

                res.status(200).json({
                    message: "The user remove from project",
                    result,
                    // allSubProjects, //TODO:1 check this
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

            if (!data.data) {
                const error = createHttpError(404, "Project not found");
                return next(error);
            }

            const id = data ? String(data.data.projectId) : "";

            if (data.new) {
                // send kafka message
                const brokerMessage = {
                    event_type: ChatEvents.ADD_USER_PROJECT_CHAT,
                    data: {
                        userId: userId,
                        isApproved: true,
                        getProjectIds: [projectId],
                    },
                };

                await this.broker.sendMessage(
                    KafKaTopic.Chat,
                    JSON.stringify(brokerMessage),
                    userId,
                );
            }

            const result = await this.resourcesService.formatResources({
                userId,
                projectId: id,
            });

            res.status(201).json({
                message: "The user added in sub section",
                result,
                // allSubProjects, //TODO:1. check this
            });
        } catch (error) {
            return next(error);
        }
    };

    addInCompany = async (req: Request, res: Response, next: NextFunction) => {
        //TODO:1. check subscription pro or basic
        //TODO:2. check resource limit
        //TODO:3. generate and saved verification token
        //TODO:4. Implement send mail functionality

        const { name, email, companyId, message } = req.body;

        this.logger.debug("New request to add resources", {
            name,
            email,
            companyId,
            message,
        });

        const role = Roles.COMPANY_ADMIN;

        try {
            const user: { userId: string } = await this.apiCallService.addUser({
                email,
                role,
                companyId,
            });

            if (!user) {
                const error = createHttpError(400, "User not found");
                return next(error);
            }

            const userId = user.userId;
            const data: { isApproved?: boolean; combinedIds?: string[] } =
                await this.projectService.AddCompanyManager(userId, companyId);

            if (data.combinedIds) {
                // send kafka message
                const brokerMessage = {
                    event_type: ChatEvents.ADD_USER_PROJECT_CHAT,
                    data: {
                        userId: user.userId,
                        isApproved: false,
                        getProjectIds: data.combinedIds,
                    },
                };

                await this.broker.sendMessage(
                    KafKaTopic.Chat,
                    JSON.stringify(brokerMessage),
                    userId,
                );
            }

            res.status(201).json({
                message: "The recipient has been invited as per your request",
                // user: userObj, //TODO:5. check this
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
            const status = ResourcesStatus.REMOVED_BY_ADMIN;

            const user = await this.apiCallService.removedFromCompany(
                companyId,
                userId,
                status,
            );

            if (!user) {
                const error = createHttpError(400, "User not found");
                return next(error);
            }

            const isRejectedByUser = false;
            await this.projectService.removedUserFromCompany(
                userId,
                companyId,
                status,
                isRejectedByUser,
            );

            let getProjectIds: string[] = [];

            const projectIds =
                await this.projectService.getProjectsIds(companyId);

            const ids =
                await this.subSectionService.getSubsectionIds(projectIds);

            getProjectIds = [...projectIds, ...ids];

            // send kafka message
            const brokerMessage = {
                event_type: ChatEvents.IS_APPROVED,
                data: {
                    userId: userId,
                    isApproved: false,
                    getProjectIds: getProjectIds,
                },
            };

            await this.broker.sendMessage(
                KafKaTopic.Chat,
                JSON.stringify(brokerMessage),
                userId,
            );

            res.status(200).json({
                message: "The user remove from company",
                // userObj, //TODO:1. check this
                // allProjectData,
            });
        } catch (error) {
            return next(error);
        }
    };

    signupUser = async (req: Request, res: Response, next: NextFunction) => {
        //TODO:1. check the resource limit

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

            let getProjectIds: string[] = [];

            if (tokenData.projectId) {
                await this.projectService.verifyResource({
                    projectId: tokenData.projectId,
                    userId: tokenData.userId,
                });

                const ids = await this.subSectionService.getSubsectionIds([
                    tokenData.projectId,
                ]);

                getProjectIds = ids;

                getProjectIds.push(tokenData.projectId);
            }

            if (tokenData.companyId) {
                await this.projectService.verifyCompanyManager(
                    tokenData.userId,
                    tokenData.companyId,
                );

                const projectIds = await this.projectService.getProjectsIds(
                    tokenData.companyId,
                );

                const ids =
                    await this.subSectionService.getSubsectionIds(projectIds);

                getProjectIds = [...projectIds, ...ids];
            }

            // send kafka message
            const brokerMessage = {
                event_type: ChatEvents.IS_APPROVED,
                data: {
                    userId: tokenData.userId,
                    isApproved: true,
                    getProjectIds: getProjectIds,
                },
            };

            await this.broker.sendMessage(
                KafKaTopic.Chat,
                JSON.stringify(brokerMessage),
                tokenData.userId,
            );

            await this.apiCallService.deleteToken(tokenData._id);

            //TODO:2. prepare login credentials and send

            res.status(201).json({ success: true, message: "Done!" });
        } catch (error) {
            return next(error);
        }
    };

    verifyResource = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        //TODO:1. check subscription
        //TODO:2. check resource length
        //TODO:3. send token for redirect on home page
        //TODO:4. isApproved true for company

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

            await this.projectService.verifyResource({
                projectId: tokenData.projectId,
                userId: tokenData.userId,
            });

            let getProjectIds: string[] = [];

            const ids = await this.subSectionService.getSubsectionIds([
                tokenData.projectId,
            ]);

            getProjectIds = ids;

            getProjectIds.push(tokenData.projectId);

            // send kafka message
            const brokerMessage = {
                event_type: ChatEvents.IS_APPROVED,
                data: {
                    userId: tokenData.userId,
                    isApproved: true,
                    getProjectIds: getProjectIds,
                },
            };

            await this.broker.sendMessage(
                KafKaTopic.Chat,
                JSON.stringify(brokerMessage),
                tokenData.userId,
            );

            await this.apiCallService.deleteToken(tokenData._id);

            res.status(200).json({ success: true, message: "Done!" });
        } catch (error) {
            return next(error);
        }
    };

    declineInvite = async (req: Request, res: Response, next: NextFunction) => {
        //TODO:1. Implement send mail functionality

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

            if (tokenData.projectId) {
                await this.projectService.removedUser({
                    userId: tokenData.userId,
                    projectId: tokenData.projectId,
                    status: ResourcesStatus.REJECTED_BY_USER,
                });
            }

            if (tokenData.companyId) {
                const status = ResourcesStatus.REJECTED_BY_USER;

                const user = await this.apiCallService.removedFromCompany(
                    tokenData.companyId,
                    tokenData.userId,
                    status,
                );

                if (!user) {
                    const error = createHttpError(400, "User not found");
                    return next(error);
                }

                const isRejectedByUser = true;
                await this.projectService.removedUserFromCompany(
                    tokenData.userId,
                    tokenData.companyId,
                    status,
                    isRejectedByUser,
                );
            }

            await this.apiCallService.deleteToken(tokenData._id);

            res.status(200).json({
                sucess: true,
                message: "Declined invitaion",
            });
        } catch (error) {
            return next(error);
        }
    };
}
