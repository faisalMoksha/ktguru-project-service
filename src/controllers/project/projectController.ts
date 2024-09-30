import { NextFunction, Response } from "express";
import { Request as AuthRequest } from "express-jwt";
import { Logger } from "winston";
import createHttpError from "http-errors";
import { ProjectService } from "../../services/projectService";
import { validationResult } from "express-validator";
import { ApiCallService } from "../../services/apiCallService";
import { Resources, Subscription } from "../../types";
import { MessageBroker } from "../../types/broker";
import { ChatEvents, KafKaTopic, Roles } from "../../constants";
import { Config } from "../../config";

export class ProjectController {
    constructor(
        private logger: Logger,
        private projectService: ProjectService,
        private apiCallService: ApiCallService,
        private broker: MessageBroker,
    ) {}

    create = async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { projectName, projectDesc, technology, companyId } = req.body;

        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        this.logger.debug("Request to craete project", {
            projectName,
            projectDesc,
            technology,
            companyId,
        });

        try {
            if (!req.auth || !req.auth.sub) {
                return next(
                    createHttpError(400, "Unauthorized access to project"),
                );
            }

            const createdBy = req.auth.sub;

            const subscription: Subscription =
                await this.apiCallService.getSubscriptionById(companyId);

            if (!subscription) {
                const error = createHttpError(
                    422,
                    "You're unable to create a project as your plan has expired.",
                );
                return next(error);
            }

            const projects =
                await this.projectService.getProjectsByCompanyId(companyId);

            if (projects.length >= 1 && subscription.planId.freeTrial) {
                const error = createHttpError(
                    422,
                    "Your current status is on a free trial Basic, and you are limited to 1 project. Kindly upgrade your subscription to be able to create more projects. Please reach out to info@ktguru.com for more information",
                );
                return next(error);
            }

            if (projects.length >= subscription.planId.totalProject) {
                const error = createHttpError(
                    422,
                    `Your current plan is ${subscription.planId.planName}, and you are limited to ${subscription.planId.totalProject} project.`,
                );
                return next(error);
            }

            const resource: { companyName: string; teamsData: Resources[] } =
                await this.apiCallService.getCompanyResourceData(companyId);

            if (!resource) {
                const error = createHttpError(400, "Teams data not found");
                return next(error);
            }

            const project = await this.projectService.create({
                projectName,
                projectDesc,
                technology,
                companyId,
                companyName: resource.companyName,
                resource: resource.teamsData,
                createdBy,
            });

            if (Config.NODE_ENV != "test") {
                // send kafka message
                const brokerMessage = {
                    event_type: ChatEvents.CHAT_CREATE,
                    data: {
                        chatName: project.projectName,
                        projectId: project._id,
                        users: project.resources,
                    },
                };

                await this.broker.sendMessage(
                    KafKaTopic.Chat,
                    JSON.stringify(brokerMessage),
                    project._id.toString(),
                );
            }

            res.status(201).json({
                data: project,
                message: "Successfuly project created",
            });
        } catch (error) {
            return next(error);
        }
    };

    update = async (req: AuthRequest, res: Response, next: NextFunction) => {
        const _id = req.params.id;
        const { projectName, projectDesc, technology } = req.body;

        if (!req.auth || !req.auth.sub) {
            return next(createHttpError(400, "Unauthorized access to project"));
        }

        const addedBy = req.auth.sub;

        try {
            const checkRole = await this.projectService.checkProjectRole(
                _id,
                addedBy,
            );

            if (!checkRole || checkRole.userRole == Roles.CONSULTANT) {
                const error = createHttpError(
                    403,
                    "You don't have enough permissions",
                );
                return next(error);
            }

            const data = await this.projectService.update({
                _id,
                projectName,
                projectDesc,
                technology,
            });

            if (Config.NODE_ENV != "test") {
                // send kafka message
                const brokerMessage = {
                    event_type: ChatEvents.CHAT_UPDATE,
                    data: {
                        chatName: projectName,
                        projectId: _id,
                    },
                };

                await this.broker.sendMessage(
                    KafKaTopic.Chat,
                    JSON.stringify(brokerMessage),
                    _id.toString(),
                );
            }

            res.status(200).json({
                data,
                message: "Project updated successfully",
            });
        } catch (error) {
            return next(error);
        }
    };

    getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.auth || !req.auth.sub) {
                return next(
                    createHttpError(400, "Unauthorized access to project"),
                );
            }

            const userId = req.auth.sub;

            const data = await this.projectService.getAll(userId);

            res.status(200).json({ data });
        } catch (error) {
            return next(error);
        }
    };

    getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
        const projectId = req.params.id;

        if (!projectId) {
            next(createHttpError(400, "Invalid url param."));
            return;
        }

        try {
            const data = await this.projectService.findById(projectId);

            if (!data) {
                next(createHttpError(400, "Project does not exist."));
                return;
            }

            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    };
}
