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

        const subsection = await subSectionService.getAll(userId, projectId);

        const matchingSubSection = subsection.reduce<ProjectResource[]>(
            (acc, subsectionData) => {
                const matchedResource = subsectionData.resources.find(
                    (resource) => resource.userId._id.toString() === userId,
                );

                if (matchedResource) {
                    acc.push({
                        _id: subsectionData._id,
                        projectName: subsectionData.projectName,
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
}
