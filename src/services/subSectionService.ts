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
        // .populate("companyId", "teams"); //TODO:1. uncomment (populate company data)

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

        let newSubsection = await subSectionModel.create({
            projectName,
            projectDesc,
            technology,
            projectId,
            createdBy: createdBy,
            isActive: true,
            resources: resourcesArray,
        });

        newSubsection = await newSubsection.populate({
            path: "resources.userId",
            model: "UserCache",
            select: "firstName lastName avatar",
            foreignField: "userId",
        });

        return newSubsection;
    }

    async update({
        _id,
        projectName,
        projectDesc,
        technology,
        projectId,
    }: RequestBody) {
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
        return await subSectionModel
            .find({
                projectId: projectId,
                $and: [
                    {
                        resources: {
                            $elemMatch: { userId: userId, isApproved: true },
                        },
                    },
                ],
            })
            .populate({
                path: "resources.userId",
                model: "UserCache",
                select: "firstName lastName avatar",
                foreignField: "userId",
            });
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
        const data = await subSectionModel
            .findOneAndUpdate(
                {
                    _id: projectId,
                    resources: { $elemMatch: { userId: userId } },
                },
                { $set: { "resources.$.isApproved": true } },
            )
            .populate({
                path: "resources.userId",
                model: "UserCache",
                select: "firstName lastName avatar",
                foreignField: "userId",
            });

        if (!data) {
            const data = await subSectionModel
                .findByIdAndUpdate(
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
                )
                .populate({
                    path: "resources.userId",
                    model: "UserCache",
                    select: "firstName lastName avatar",
                    foreignField: "userId",
                });

            return { data: data, new: true };
        }

        return { data: data, new: false };
    }

    async getSubsectionIds(projectIds: string[]) {
        const subSectionIds = await subSectionModel.distinct("_id", {
            projectId: { $in: projectIds },
        });

        return subSectionIds;
    }
}
