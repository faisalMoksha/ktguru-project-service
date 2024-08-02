import { NextFunction, Response, Request } from "express";
import { Logger } from "winston";
import { Request as AuthRequest } from "express-jwt";
import createHttpError from "http-errors";
import { SubSectionService } from "../../services/subSectionService";

export class SubSectionController {
    constructor(
        private logger: Logger,
        private subSectionService: SubSectionService,
    ) {}

    create = async (req: Request, res: Response, next: NextFunction) => {
        const { projectName, projectDesc, technology, projectId } = req.body;

        this.logger.debug("Request to craete sub section", {
            projectName,
            projectDesc,
            technology,
            projectId,
        });

        try {
            const project = await this.subSectionService.create({
                projectName,
                projectDesc,
                technology,
                projectId,
            });

            res.status(201).json({
                data: project,
                message: "Successfuly sub section created",
            });
        } catch (error) {
            return next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const _id = req.params.id;
        const { projectName, projectDesc, technology, projectId } = req.body;

        try {
            const data = await this.subSectionService.update({
                _id,
                projectName,
                projectDesc,
                technology,
                projectId,
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
                return next(createHttpError(400, "Something went wrong"));
            }

            const userId = req.auth.sub;
            const projectId = req.params.id;

            const data = await this.subSectionService.getAll(userId, projectId);
            res.status(200).json({ data });
        } catch (error) {
            return next(error);
        }
    };

    getOne = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;

        if (!id) {
            next(createHttpError(400, "Invalid url param."));
            return;
        }

        try {
            const data = await this.subSectionService.findById(id);

            if (!data) {
                next(createHttpError(400, "Sub Section does not exist."));
                return;
            }

            res.json(data);
        } catch (err) {
            next(err);
        }
    };
}
