import { NextFunction, Request, Response } from "express";
import { Request as AuthRequest } from "express-jwt";
import { Logger } from "winston";
import createHttpError from "http-errors";
import { ProjectService } from "../../services/projectService";
import { validationResult } from "express-validator";
import { ApiCallService } from "../../services/apiCallService";

export class ProjectController {
    constructor(
        private logger: Logger,
        private projectService: ProjectService,
        private apiCallService: ApiCallService,
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

            const resource =
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
                resource,
                createdBy,
            });

            res.status(201).json({
                data: project,
                message: "Successfuly project created",
            });
        } catch (error) {
            next(error);
            return;
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const _id = req.params.id;
        const { projectName, projectDesc, technology } = req.body;

        try {
            const data = await this.projectService.update({
                _id,
                projectName,
                projectDesc,
                technology,
            });

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
