import { AddUserInProject, RequestBody } from "../types";
import subSectionModel from "../models/subSectionModel";
import createHttpError from "http-errors";
import projectModel from "../models/projectModel";
import { ResourcesStatus, Roles } from "../constants";

export class SubSectionService {
    async create({
        projectName,
        projectDesc,
        technology,
        projectId,
        createdBy,
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
        // .populate("companyId", "teams"); //TODO:3. uncomment (populate company data)

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
            createdBy: createdBy,
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
        // TODO:1. also change chat group name
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
        // .populate("resources.userId", "lastName firstName avatar email"); //TODO:1. uncomment this line
    }

    async findById(id: string) {
        return await subSectionModel.findById(id);
    }

    async addUserInSubSection({ userId, projectId }: AddUserInProject) {
        return await subSectionModel.updateMany({ projectId: projectId }, [
            {
                $set: {
                    resources: {
                        $cond: {
                            if: { $in: [userId, "$resources.userId"] },
                            then: {
                                $map: {
                                    input: "$resources",
                                    as: "resource",
                                    in: {
                                        $cond: {
                                            if: {
                                                $eq: [
                                                    "$$resource.userId",
                                                    userId,
                                                ],
                                            },
                                            then: {
                                                $mergeObjects: [
                                                    "$$resource",
                                                    {
                                                        status: ResourcesStatus.PENDING,
                                                    },
                                                ],
                                            },
                                            else: "$$resource",
                                        },
                                    },
                                },
                            },
                            else: {
                                $concatArrays: [
                                    "$resources",
                                    [
                                        {
                                            userRole: Roles.PROJECT_ADMIN,
                                            userId: userId,
                                            isApproved: false,
                                            createdAt: new Date(),
                                            status: ResourcesStatus.PENDING,
                                        },
                                    ],
                                ],
                            },
                        },
                    },
                },
            },
        ]);
    }

    async bulkAdd(userId: string, subSectionIds: [string]) {
        return await subSectionModel.bulkWrite(
            subSectionIds.map((subSectionId) => ({
                updateOne: {
                    filter: {
                        _id: subSectionId,
                        "resources.userId": { $ne: userId },
                    },
                    update: {
                        $addToSet: {
                            resources: {
                                userRole: Roles.CONSULTANT,
                                userId: userId,
                                isApproved: false,
                                createdAt: new Date(),
                            },
                        },
                    },
                },
            })),
        );
    }

    async notPresent({ userId, projectId }: AddUserInProject) {
        return await subSectionModel.find({
            projectId,
            $or: [
                { "resources.userId": { $ne: userId } },
                { "resources.userId": userId, "resources.isApproved": false },
            ],
        });
    }

    async removedUser({ userId, projectId }: AddUserInProject) {
        return await subSectionModel.updateMany(
            {
                projectId: projectId,
                resources: { $elemMatch: { userId: userId } },
            },
            { $set: { "resources.$.isApproved": false } },
        );
    }

    async removedUserFromOne({ userId, projectId }: AddUserInProject) {
        return await subSectionModel.findOneAndUpdate(
            {
                _id: projectId,
                resources: { $elemMatch: { userId: userId } },
            },
            { $set: { "resources.$.isApproved": false } },
        );
    }

    async addIUserInSingleSubSection({
        userId,
        projectId,
        role,
    }: AddUserInProject) {
        //TODO:1. add data in chat
        //TODO:2. populate project data if needed
        const data = await subSectionModel.findOneAndUpdate(
            {
                _id: projectId,
                resources: { $elemMatch: { userId: userId } },
            },
            { $set: { "resources.$.isApproved": true } },
        );

        if (!data) {
            return await subSectionModel.findByIdAndUpdate(
                { _id: projectId },
                {
                    $push: {
                        resources: {
                            userRole: role,
                            userId: userId,
                            isApproved: true,
                        },
                    },
                },
                { new: true },
            );
        }

        return data;
    }
}
