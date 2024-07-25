import { RequestBody } from "../types";
import subSectionModel from "../models/project/subSectionModel";
import createHttpError from "http-errors";
import projectModel from "../models/project/projectModel";
import { Roles } from "../constants";

export class SubSectionService {
    async create({
        projectName,
        projectDesc,
        technology,
        projectId,
    }: RequestBody) {
        //TODO:1. populate some data and send response
        //TODO:2. create subsection chat

        const findProject = await subSectionModel.find({
            $and: [
                { projectId: projectId },
                { projectName: { $regex: projectName, $options: "i" } },
            ],
        });

        if (findProject.length > 0) {
            const error = createHttpError(
                500,
                `A subsection named ${projectName} already exists. Please select a different name.`,
            );
            throw error;
        }

        const projectData = await projectModel.findById(projectId);
        // .populate("companyId", "teams"); //TODO: uncomment

        if (!projectData) {
            const error = createHttpError(500, `Project data not found`);
            throw error;
        }

        const teamsData = projectData.resources;

        const filteredResourcesData = [
            Roles.PROJECT_ADMIN as string,
            Roles.COMPANY_ADMIN as string,
            Roles.ADMIN as string,
        ];

        const filteredResources = teamsData.filter((resource) =>
            filteredResourcesData.includes(resource.userRole),
        );

        const resourcesArray = filteredResources.map(
            ({ userId, userRole, isApproved }) => ({
                userId,
                userRole,
                isApproved,
            }),
        );

        return await subSectionModel.create({
            projectName,
            projectDesc,
            technology,
            projectId,
            createdBy: "6512a4c42a6759c77211660e",
            isActive: true,
            resources: resourcesArray,
        });
    }

    async update({
        _id,
        projectName,
        projectDesc,
        technology,
        projectId,
    }: RequestBody) {
        // TODO:1. also change chta group name
        try {
            const findProject = await subSectionModel.find({
                $and: [
                    { projectId: projectId },
                    { projectName: { $regex: projectName, $options: "i" } },
                ],
            });

            if (findProject.length > 0) {
                const error = createHttpError(
                    500,
                    `A subsection named ${projectName} already exists. Please select a different name.`,
                );
                throw error;
            }

            return await subSectionModel.findByIdAndUpdate(
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

    async getAll(userId: string, projectId: string) {
        return await subSectionModel.find({
            projectId: projectId,
            $and: [
                {
                    resources: {
                        $elemMatch: { userId: userId, isApproved: true },
                    },
                },
            ],
        });
        // .populate("resources.userId", "lastName firstName avatar email"); //TODO: uncomment this line
    }

    async findById(id: string) {
        return await subSectionModel.findById(id);
    }
}
