import createHttpError from "http-errors";
import { AddUserInProject, RequestBody } from "../types";
import projectModel from "../models/project/projectModel";
import { ResourcesStatus, Roles } from "../constants";
import subSectionModel from "../models/project/subSectionModel";

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
                                : Roles.COMPANY_ADMIN,
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
        return await projectModel.findOne({ _id: projectId });
    }

    async removedUser({ userId, projectId }: AddUserInProject) {
        //TODO: populate user data
        return await projectModel.findOneAndUpdate(
            {
                _id: projectId,
                resources: { $elemMatch: { userId: userId } },
            },
            {
                $set: {
                    "resources.$.isApproved": false,
                    "resources.$.status": "removedByAdmin",
                },
            },
            { new: true },
        );
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

        const checkMemberIsApproved = await projectModel.findOne({
            companyId: companyId,
            resources: {
                $elemMatch: { userId: userId, isApproved: false },
            },
        });

        if (checkMemberIsApproved) {
            //TODO:1. generate and saved verification token
            //TODO:2. send mail
            //TODO:2. send user obj

            return true;
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

        // Get subproject IDs
        const subSectionIds = await subSectionModel.distinct("_id", {
            projectId: { $in: projectIds },
        });

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
        return await subSectionModel.bulkWrite(bulkOps, { ordered: false });

        //TODO:1. Generate and saved the varification token
        //TODO:2. Send mail notification
        //TODO:3. add user in chat group
    }

    async removedUserFromCompany(userId: string, companyId: string) {
        await projectModel.updateMany(
            {
                companyId: companyId,
                resources: { $elemMatch: { userId: userId } },
            },
            { $set: { "resources.$.isApproved": false } },
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
                $set: { "resources.$[elem].isApproved": false },
            },
            {
                arrayFilters: [{ "elem.userId": userId }],
                multi: true,
            },
        );

        //TODO:1. remove fro chat group

        return result;
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

        //TODO:1. also need to do with chat both project and subsections
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

        //TODO:1. add in chat group for both

        return result;
    }
}
