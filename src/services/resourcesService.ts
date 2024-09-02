import createHttpError from "http-errors";
import { ProjectService } from "./projectService";
import { SubSectionService } from "./subSectionService";
import {
    AddUserInProject,
    ProjectPayload,
    ProjectResource,
    SubSectionPayload,
} from "../types";
import userCacheModel from "../models/userCacheModel";
import projectModel from "../models/projectModel";
import logger from "../config/logger";
import subSectionModel from "../models/subSectionModel";

const projectService = new ProjectService();
const subSectionService = new SubSectionService();

export class ResourcesServices {
    async formatResources({ userId, projectId }: AddUserInProject) {
        const projectData: ProjectPayload | null =
            await projectService.findById(projectId);

        if (!projectData) {
            const error = createHttpError(404, "Project not found");
            throw error;
        }

        const subsection: SubSectionPayload[] | [] =
            await subSectionService.getAll(userId, projectId);

        const matchingSubSection = subsection.reduce<ProjectResource[]>(
            (acc, subsectionData) => {
                const matchedResource = subsectionData.resources.find(
                    (resource) => resource.userId.userId === userId,
                );

                if (matchedResource) {
                    acc.push({
                        _id: subsectionData._id,
                        projectName: subsectionData.projectName,
                        userId: matchedResource.userId,
                        userRole: matchedResource.userRole,
                        isApproved: matchedResource.isApproved,
                        status: matchedResource.status,
                        createdAt: matchedResource.createdAt,
                    });
                }
                return acc;
            },
            [],
        );

        const matchedResourcesProject = projectData.resources.find(
            (resource) => resource.userId.userId.toString() === userId,
        );

        const notPresentSubsection = await subSectionService.notPresent({
            userId,
            projectId,
        });

        const notMatchingSubSection = notPresentSubsection.map(
            (subsectionData) => ({
                id: subsectionData._id,
                projectName: subsectionData.projectName,
            }),
        );

        if (matchedResourcesProject) {
            const { _id, projectName } = projectData;

            const result = {
                _id,
                projectName,
                matchedResourcesProject,
                matchingSubSection,
                notMatchingSubSection,
            };

            return result;
        }

        return null;
    }

    async getUserInfo(userId: string) {
        return await userCacheModel.findOne({ userId: userId });
    }

    async getResource(projectId: string, model_type: string) {
        switch (model_type) {
            case "Project": {
                const project = await projectModel.findById(projectId).select({
                    projectName: 1,
                    resources: {
                        $filter: {
                            input: "$resources",
                            as: "resource",
                            cond: { $eq: ["$$resource.isApproved", true] },
                        },
                    },
                });

                return {
                    data: project?.resources || [],
                    projectName: project?.projectName,
                };
            }

            case "Subsection": {
                const subscription = await subSectionModel
                    .findById(projectId)
                    .select({
                        projectName: 1,
                        resources: {
                            $filter: {
                                input: "$resources",
                                as: "resource",
                                cond: { $eq: ["$$resource.isApproved", true] },
                            },
                        },
                    });

                return {
                    data: subscription?.resources || [],
                    projectName: subscription?.projectName,
                };
            }
            default:
                logger.info("Doing nothing...");
                return null;
        }
    }
}
