import createHttpError from "http-errors";
import projectModel from "../models/project/projectModel";
import { RequestBody } from "../types";

export class ProjectService {
    async create({
        projectName,
        projectDesc,
        technology,
        companyId,
    }: RequestBody) {
        //TODO:1. check subscription is active
        //TODO:2. check project length
        //TODO:3. arrange resources data and save
        //TODO:4. populate some data and send response
        //TODO:5. create project chat

        return await projectModel.create({
            projectName,
            projectDesc,
            technology,
            companyId,
            createdBy: "6512a4c42a6759c77211660e",
            isActive: true,
            // resources: // TODO: uncomment this
        });
    }

    async update({ _id, projectName, projectDesc, technology }: RequestBody) {
        try {
            return await projectModel.findByIdAndUpdate(
                _id,
                { projectName, projectDesc, technology },
                {
                    new: true,
                },
            );
        } catch (err) {
            const error = createHttpError(500, "Failed to update the project");
            throw error;
        }
    }

    async getAll(userId: string) {
        //TODO:1. check old code
        return await projectModel.find({
            resources: {
                $elemMatch: { userId: userId, isApproved: true },
            },
        });
    }

    async findById(id: string) {
        return await projectModel.findById(id);
    }
}
