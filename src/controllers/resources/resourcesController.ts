import { Request, NextFunction, Response } from "express";
import { Logger } from "winston";
import { Request as AuthRequest } from "express-jwt";
import createHttpError from "http-errors";
import {
    ChatEvents,
    KafKaTopic,
    MailEvents,
    PlanNames,
    ResourcesStatus,
    Roles,
} from "../../constants";
import { ApiCallService } from "../../services/apiCallService";
import { ProjectService } from "../../services/projectService";
import { SubSectionService } from "../../services/subSectionService";
import { ResourcesServices } from "../../services/resourcesService";
import { Subscription, ValueFromApiCall, VerificationToken } from "../../types";
import { MessageBroker } from "../../types/broker";
import { Config } from "../../config";

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
        const { email, message, projectId, subSectionIds, role } = req.body;

        this.logger.debug("New request to add resources", {
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
            const checkRole = await this.projectService.checkProjectRole(
                projectId,
                addedBy,
            );

            if (!checkRole || checkRole.userRole == Roles.CONSULTANT) {
                const error = createHttpError(
                    403,
                    "You don't have enough permissions",
                );
                return next(error);
            }

            const getProject = await this.projectService.findById(projectId);

            const subscription: Subscription =
                await this.apiCallService.getSubscriptionById(
                    String(getProject?.companyId),
                );

            if (!subscription) {
                const error = createHttpError(
                    422,
                    "You cannot add resources because your plan has expired.",
                );
                return next(error);
            }

            const approvedResources = getProject?.resources.filter(
                (item) => item.isApproved == true,
            );

            const filterRoleBased = approvedResources?.filter(
                (item) =>
                    item.userRole != Roles.ADMIN &&
                    item.userRole != Roles.COMPANY_ADMIN,
            );

            if (
                filterRoleBased &&
                filterRoleBased.length >= subscription.planId.totalConsultant
            ) {
                const error = createHttpError(
                    422,
                    `Your current plan is ${subscription.planId.planName}, and you are limited to ${subscription.planId.totalConsultant} consultants.`,
                );
                return next(error);
            }

            const user: ValueFromApiCall = await this.apiCallService.addUser({
                email,
                role,
                projectId,
                addedBy,
                companyId: String(getProject?.companyId),
            });

            if (!user) {
                const error = createHttpError(400, "User not found");
                return next(error);
            }

            const projectData = await this.projectService.addUserInProject({
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

            if (Config.NODE_ENV != "test") {
                // send kafka message for add in chat
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
            }

            if (Config.NODE_ENV != "test") {
                const getUserData =
                    await this.resourcesService.getUserInfo(addedBy);

                // send kafka message to mail service
                const brokerMessage = {
                    event_type: MailEvents.SEND_MAIL,
                    data: {
                        to: email,
                        subject: "KT-Guru Consultant Invitation",
                        context: {
                            name:
                                getUserData?.firstName +
                                " " +
                                getUserData?.lastName,
                            url: user.url,
                            declineURL: user.declineURL,
                            projectName: projectData?.projectName,
                            role: role,
                            message: message,
                            companyName: user.companyName,
                        },
                        template: "consultant-invitation", // name of the template file i.e verify-email.hbs
                    },
                };

                await this.broker.sendMessage(
                    KafKaTopic.Mail,
                    JSON.stringify(brokerMessage),
                    user.userId.toString(),
                );
            }

            res.status(201).json({
                message: "The recipient has been invited as per your request",
            });
        } catch (error) {
            return next(error);
        }
    };

    get = async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.auth || !req.auth.sub) {
            return next(createHttpError(400, "Something went wrong"));
        }

        const addedBy = req.auth.sub;

        const projectId = req.params.id;

        const checkRole = await this.projectService.checkProjectRole(
            projectId,
            addedBy,
        );

        if (!checkRole || checkRole.userRole == Roles.CONSULTANT) {
            const error = createHttpError(
                403,
                "You don't have enough permissions",
            );
            return next(error);
        }

        const data = await this.projectService.getResources(projectId);

        res.status(200).json(data?.resources);
    };

    getDetails = async (req: Request, res: Response, next: NextFunction) => {
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
                    message: "User removed from project successfully",
                    data: result,
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
                if (Config.NODE_ENV != "test") {
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
            }

            const result = await this.resourcesService.formatResources({
                userId,
                projectId: id,
            });

            res.status(201).json({
                message: "User added to project successfully",
                data: result,
            });
        } catch (error) {
            return next(error);
        }
    };

    addInCompany = async (
        req: AuthRequest,
        res: Response,
        next: NextFunction,
    ) => {
        const { name, email, companyId, message } = req.body;

        if (!req.auth || !req.auth.sub) {
            return next(createHttpError(400, "Something went wrong"));
        }

        const addedBy = req.auth.sub;

        this.logger.debug("New request to add resources", {
            name,
            email,
            companyId,
            message,
        });

        const role = Roles.COMPANY_ADMIN;

        try {
            const subscription: Subscription =
                await this.apiCallService.getSubscriptionById(companyId);

            if (!subscription) {
                const error = createHttpError(
                    422,
                    "You cannot add a company admin because your plan has expired.",
                );
                return next(error);
            }

            if (subscription.planId.planName != PlanNames.ENTERPRISE) {
                const error = createHttpError(
                    422,
                    `Your current plan is ${subscription.planId.planName}, you are not allowed to add company admin. Kindly upgrade your subscription to ${PlanNames.ENTERPRISE} Plan if you wish to add more Company Admins. Please drop a note to info@ktguru.com`,
                );
                return next(error);
            }

            const user: ValueFromApiCall = await this.apiCallService.addUser({
                email,
                role,
                companyId,
            });

            if (!user) {
                const error = createHttpError(400, "User not found");
                return next(error);
            }

            const userId = user.userId;
            const data: { isAdded?: boolean; combinedIds?: string[] } =
                await this.projectService.AddCompanyManager(userId, companyId);

            if (data.combinedIds) {
                if (Config.NODE_ENV != "test") {
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
            }

            if (Config.NODE_ENV != "test") {
                const getUserData =
                    await this.resourcesService.getUserInfo(addedBy);

                // send kafka message to mail service
                const brokerMessage = {
                    event_type: MailEvents.SEND_MAIL,
                    data: {
                        to: email,
                        subject: "KT-Guru Invitation for company manager",
                        context: {
                            name:
                                getUserData?.firstName +
                                " " +
                                getUserData?.lastName,
                            url: user.url,
                            declineURL: user.declineURL,
                            role: role,
                            message: message,
                            companyName: user.companyName,
                        },
                        template: "company-invitation", // name of the template file i.e verify-email.hbs
                    },
                };

                await this.broker.sendMessage(
                    KafKaTopic.Mail,
                    JSON.stringify(brokerMessage),
                    user.userId.toString(),
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

            if (Config.NODE_ENV != "test") {
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
            }

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
        //TODO:1. Prepare login credentials and send

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

            if (tokenData.projectId) {
                const getProject = await this.projectService.findById(
                    tokenData.projectId,
                );

                const addedBy = await this.resourcesService.getUserInfo(
                    String(tokenData.addedBy),
                );

                const subscription: Subscription =
                    await this.apiCallService.getSubscriptionById(
                        String(tokenData.companyId),
                    );

                if (!subscription) {
                    const error = createHttpError(
                        422,
                        `Oops, plan has expired, please reach out to ${addedBy?.email}`,
                    );
                    return next(error);
                }

                const approvedResources = getProject?.resources.filter(
                    (item) => item.isApproved == true,
                );

                const filterRoleBased = approvedResources?.filter(
                    (item) =>
                        item.userRole != Roles.ADMIN &&
                        item.userRole != Roles.COMPANY_ADMIN,
                );

                if (
                    filterRoleBased &&
                    filterRoleBased.length >=
                        subscription.planId.totalConsultant
                ) {
                    const error = createHttpError(
                        422,
                        `Oops, the invitation timed out, please reach out to ${addedBy?.email} from 
                        ${getProject?.projectName}`,
                    );
                    return next(error);
                }
            }

            const user = await this.apiCallService.signupUser({
                firstName,
                lastName,
                password,
                userId: tokenData.userId,
                companyId: tokenData.companyId,
                role: tokenData.role,
            });

            if (!user) {
                const error = createHttpError(400, "User not found");
                return next(error);
            }

            let getProjectIds: string[] = [];

            if (
                tokenData.role == Roles.PROJECT_ADMIN ||
                tokenData.role == Roles.CONSULTANT
            ) {
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

            if (tokenData.role == Roles.COMPANY_ADMIN) {
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

            if (Config.NODE_ENV != "test") {
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
            }

            await this.apiCallService.deleteToken(tokenData._id);

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
        //TODO:1. Prepare login credentials and send
        //TODO:2. isApproved true for company

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
                const getProject = await this.projectService.findById(
                    tokenData.projectId,
                );

                const subscription: Subscription =
                    await this.apiCallService.getSubscriptionById(
                        String(getProject?.companyId),
                    );

                if (!subscription) {
                    const error = createHttpError(
                        422,
                        `Oops, plan has expired, please reach out to admin`,
                    );
                    return next(error);
                }

                const approvedResources = getProject?.resources.filter(
                    (item) => item.isApproved == true,
                );

                const filterRoleBased = approvedResources?.filter(
                    (item) =>
                        item.userRole != Roles.ADMIN &&
                        item.userRole != Roles.COMPANY_ADMIN,
                );

                if (
                    filterRoleBased &&
                    filterRoleBased.length >=
                        subscription.planId.totalConsultant
                ) {
                    const error = createHttpError(
                        422,
                        `We apologize, but it's not possible for you to accept the invitation due to the project's restriction of ${subscription.planId.totalConsultant} consultants. Please reach out to the project administrator.`,
                    );
                    return next(error);
                }
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

            if (Config.NODE_ENV != "test") {
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
            }

            await this.apiCallService.deleteToken(tokenData._id);

            res.status(200).json({ success: true, message: "Done!" });
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

            let entityName: string = "";
            if (tokenData.projectId) {
                const projectData = await this.projectService.removedUser({
                    userId: tokenData.userId,
                    projectId: tokenData.projectId,
                    status: ResourcesStatus.REJECTED_BY_USER,
                });

                entityName = projectData?.projectName
                    ? projectData.projectName
                    : "";
            }

            if (tokenData.role == Roles.COMPANY_ADMIN) {
                const status = ResourcesStatus.REJECTED_BY_USER;

                const user: { companyName: string } =
                    await this.apiCallService.removedFromCompany(
                        tokenData.companyId,
                        tokenData.userId,
                        status,
                    );

                if (!user) {
                    const error = createHttpError(400, "User not found");
                    return next(error);
                }

                entityName = user.companyName;

                const isRejectedByUser = true;
                await this.projectService.removedUserFromCompany(
                    tokenData.userId,
                    tokenData.companyId,
                    status,
                    isRejectedByUser,
                );
            }

            if (Config.NODE_ENV != "test") {
                const addedByUser = await this.resourcesService.getUserInfo(
                    String(tokenData.addedBy),
                );

                const getUser = await this.resourcesService.getUserInfo(
                    String(tokenData.userId),
                );

                // send kafka message to mail service
                const brokerMessage = {
                    event_type: MailEvents.SEND_MAIL,
                    data: {
                        to: addedByUser?.email,
                        subject: "Invitation Declined",
                        context: {
                            name:
                                addedByUser?.firstName +
                                " " +
                                addedByUser?.lastName,
                            invitedUser: getUser?.email,
                            entityName: entityName,
                        },
                        template: "decline-invitation", // name of the template file i.e verify-email.hbs
                    },
                };

                await this.broker.sendMessage(
                    KafKaTopic.Mail,
                    JSON.stringify(brokerMessage),
                    tokenData.addedBy.toString(),
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

    getResourceData = async (req: Request, res: Response) => {
        const { projectId, model_type } = req.body;

        try {
            const data = await this.resourcesService.getResource(
                projectId,
                model_type,
            );

            return res.status(200).json(data);
        } catch (error) {
            res.status(404).json(error);
        }
    };
}
