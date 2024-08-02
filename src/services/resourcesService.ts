import createHttpError from "http-errors";
import { ProjectService } from "./projectService";
import { SubSectionService } from "./subSectionService";
import { AddUserInProject, ProjectResource } from "../types";

const projectService = new ProjectService();
const subSectionService = new SubSectionService();

export class ResourcesServices {
    async formatResources({ userId, projectId }: AddUserInProject) {
        const projectData = await projectService.findById(projectId);

        if (!projectData) {
            const error = createHttpError(404, "Project not found");
            throw error;
        }

        const subProjects = await subSectionService.getAll(userId, projectId);

        const matchingSubProjects = subProjects.reduce<ProjectResource[]>(
            (acc, subProject) => {
                const matchedResource = subProject.resources.find(
                    (resource) => resource.userId._id.toString() === userId,
                );

                if (matchedResource) {
                    acc.push({
                        _id: subProject._id,
                        projectName: subProject.projectName,
                        // @ts-ignore
                        userId: matchedResource.userId,
                        userRole: matchedResource.userRole,
                        isApproved: matchedResource.isApproved,
                    });
                }
                return acc;
            },
            [],
        );

        const matchedResourcesProject = projectData.resources.find(
            (resource) => resource.userId._id.toString() === userId,
        );

        const notPresentSubProjects = await subSectionService.notPresent({
            userId,
            projectId,
        });

        const notMatchingSubProjects = notPresentSubProjects.map(
            (subProject) => ({
                id: subProject._id,
                projectName: subProject.projectName,
            }),
        );

        if (matchedResourcesProject) {
            const { _id, projectName } = projectData;

            const result = {
                _id,
                projectName,
                matchedResourcesProject,
                matchingSubProjects,
                notMatchingSubProjects,
            };

            return result;
        }

        return null;
    }
}
