import createHttpError from "http-errors";
import { AddUserInProject, RequestBody } from "../types";
import projectModel from "../models/projectModel";
import { ResourcesStatus, Roles } from "../constants";
import subSectionModel from "../models/subSectionModel";

export class ProjectService {
    async create({
        projectName,
        projectDesc,
        technology,
        companyId,
        resource,
        createdBy,
        companyName,
    }: RequestBody) {
        let data = await projectModel.create({
            projectName,
            projectDesc,
            technology,
            companyId,
            companyName: companyName,
            createdBy: createdBy,
            isActive: true,
            resources: resource,
        });

        data = await data.populate({
            path: "resources.userId",
            model: "UserCache",
            select: "firstName lastName avatar",
            foreignField: "userId",
        });

        return data;
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
        //TODO:1. Check old code
        return await projectModel
            .find({
                resources: {
                    $elemMatch: { userId: userId, isApproved: true },
                },
            })
            .populate({
                path: "resources.userId",
                model: "UserCache",
                select: "firstName lastName avatar",
                foreignField: "userId",
            });
    }

    async findById(id: string) {
        return await projectModel.findById(id);
    }

    async addUserInProject({ userId, projectId, role }: AddUserInProject) {
        const checkAlreadyMember = await projectModel.findOne({
            _id: projectId,
            resources: {
                $elemMatch: { userId: userId, isApproved: true },
            },
        });

        if (checkAlreadyMember) {
            const error = createHttpError(
                409,
                "Sorry, this user is already a member of the project.",
            );
            throw error;
        }

        const checkUser = await projectModel.findOne({
            _id: projectId,
            resources: {
                $elemMatch: { userId: userId, isApproved: false },
            },
        });

        if (checkUser) {
            return await projectModel.findOneAndUpdate(
                {
                    _id: projectId,
                    resources: { $elemMatch: { userId: userId } },
                },
                {
                    $set: {
                        "resources.$.status": ResourcesStatus.PENDING,
                    },
                },
            );
        }

        return await projectModel.findByIdAndUpdate(
            { _id: projectId },
            {
                $push: {
                    resources: {
                        userRole:
                            role == Roles.CONSULTANT
                                ? Roles.CONSULTANT
                                : Roles.PROJECT_ADMIN,
                        userId: userId,
                        isApproved: false,
                        createdAt: new Date(),
                        status: ResourcesStatus.PENDING,
                    },
                },
            },
            { new: true },
        );
    }

    async getResources(projectId: string) {
        return await projectModel.findOne({ _id: projectId }).populate({
            path: "resources.userId",
            model: "UserCache",
            select: "firstName lastName avatar",
            foreignField: "userId",
        });
    }

    async removedUser({ userId, projectId, status }: AddUserInProject) {
        return await projectModel
            .findOneAndUpdate(
                {
                    _id: projectId,
                    resources: { $elemMatch: { userId: userId } },
                },
                {
                    $set: {
                        "resources.$.isApproved": false,
                        "resources.$.status": status,
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
    }

    async AddCompanyManager(userId: string, companyId: string) {
        const checkAlreadyMember = await projectModel.findOne({
            companyId: companyId,
            resources: {
                $elemMatch: { userId: userId, isApproved: true },
            },
        });

        if (checkAlreadyMember) {
            const error = createHttpError(
                409,
                "The selected user already holds Admin rights in your company",
            );
            throw error;
        }

        const isUserAdded = await projectModel.findOne({
            companyId: companyId,
            resources: {
                $elemMatch: { userId: userId, isApproved: false },
            },
        });

        if (isUserAdded) {
            return { isAdded: true };
        }

        // Update projects
        await projectModel.updateMany(
            { companyId },
            {
                $addToSet: {
                    resources: {
                        userRole: Roles.COMPANY_ADMIN,
                        userId,
                        isApproved: false,
                    },
                },
            },
        );

        // Get project IDs
        const projectIds = await projectModel.distinct("_id", { companyId });

        // Get subSection IDs
        const subSectionIds = await subSectionModel.distinct("_id", {
            projectId: { $in: projectIds },
        });

        const combinedIds = [...projectIds, ...subSectionIds];

        // Prepare bulk update operation
        const bulkOps = subSectionIds.map((id) => ({
            updateOne: {
                filter: { _id: id },
                update: {
                    $addToSet: {
                        resources: {
                            userRole: Roles.COMPANY_ADMIN,
                            userId,
                            isApproved: false,
                        },
                    },
                },
            },
        }));

        // Execute bulk update
        await subSectionModel.bulkWrite(bulkOps, { ordered: false });

        return { combinedIds: combinedIds };
    }

    async removedUserFromCompany(
        userId: string,
        companyId: string,
        status: string,
        isRejectedByUser: boolean,
    ) {
        await projectModel.updateMany(
            {
                companyId: companyId,
                resources: { $elemMatch: { userId: userId } },
            },
            {
                $set: {
                    "resources.$.isApproved": false,
                    "resources.$.status": status,
                },
            },
        );

        if (!isRejectedByUser) {
            // Get project IDs
            const projectIds = await projectModel.distinct("_id", {
                companyId,
            });

            // Get subproject IDs
            const subSectionIds = await subSectionModel.distinct("_id", {
                projectId: { $in: projectIds },
            });

            const result = await subSectionModel.updateMany(
                {
                    _id: { $in: subSectionIds },
                    "resources.userId": userId,
                },
                {
                    $set: { "resources.$[elem].isApproved": false },
                },
                {
                    arrayFilters: [{ "elem.userId": userId }],
                    multi: true,
                },
            );

            return result;
        }

        return null;
    }

    async verifyResource({ projectId, userId }: AddUserInProject) {
        await projectModel.findOneAndUpdate(
            {
                _id: projectId,
                resources: { $elemMatch: { userId: userId } },
            },
            {
                $set: {
                    "resources.$.isApproved": true,
                    "resources.$.status": "active",
                },
            },
        );

        await subSectionModel.updateMany(
            {
                projectId: projectId,
                resources: { $elemMatch: { userId: userId } },
            },
            { $set: { "resources.$.isApproved": true } },
        );
    }

    async verifyCompanyManager(userId: string, companyId: string) {
        await projectModel.updateMany(
            {
                companyId: companyId,
                resources: { $elemMatch: { userId: userId } },
            },
            {
                $set: {
                    "resources.$.isApproved": true,
                    "resources.$.status": ResourcesStatus.ACTIVE,
                },
            },
        );

        // Get project IDs
        const projectIds = await projectModel.distinct("_id", { companyId });

        // Get subproject IDs
        const subSectionIds = await subSectionModel.distinct("_id", {
            projectId: { $in: projectIds },
        });

        const result = await subSectionModel.updateMany(
            {
                _id: { $in: subSectionIds },
                "resources.userId": userId,
            },
            {
                $set: { "resources.$[elem].isApproved": true },
            },
            {
                arrayFilters: [{ "elem.userId": userId }],
                multi: true,
            },
        );

        return result;
    }

    async getProjectsIds(companyId: string) {
        return await projectModel.distinct("_id", { companyId });
    }

    async getProjectsByCompanyId(companyId: string) {
        return await projectModel.find({ companyId, isActive: true });
    }
}
