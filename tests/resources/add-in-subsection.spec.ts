import request from "supertest";
import mongoose from "mongoose";
import createJWKSMock from "mock-jwks";
import app from "../../src/app";
import { Config } from "../../src/config";
import { ResourcesStatus, Roles } from "../../src/constants";
import projectModel from "../../src/models/projectModel";
import { Project } from "../../src/types";
import subSectionModel from "../../src/models/subSectionModel";
import userCacheModel from "../../src/models/userCacheModel";

describe("POST /resources/add-in-subsection", () => {
    let jwks: ReturnType<typeof createJWKSMock>;

    beforeEach(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        jwks.start();
        await mongoose.connect(Config.MONGO_URI!);
        await mongoose.connection.db.dropDatabase();
    });

    afterEach(async () => {
        await mongoose.connection.close();
        jwks.stop();
        jest.clearAllMocks();
    });

    describe("Given all fields", () => {
        it("should return the 201 status code and return valid json response", async () => {
            const newData = await projectModel.create({
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                companyId: "651d94b37c81f740f30892de",
                createdBy: "6512a4c42a6759c772116456",
                resources: [
                    {
                        userId: "6512a4c42a6759c772116456",
                        userRole: Roles.ADMIN,
                        isApproved: true,
                        status: ResourcesStatus.ACTIVE,
                    },
                    {
                        userId: "6512a4c42a6759c772115342",
                        userRole: Roles.CONSULTANT,
                        isApproved: true,
                        status: ResourcesStatus.ACTIVE,
                    },
                ],
            });

            const subsetion = await subSectionModel.create({
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                projectId: newData._id,
                isActive: true,
                createdBy: "6512a4c42a6759c77211662e",
                resources: [
                    {
                        userId: "6512a4c42a6759c77211662e",
                        userRole: Roles.ADMIN,
                        isApproved: true,
                        status: ResourcesStatus.ACTIVE,
                    },
                ],
            });

            await userCacheModel.create({
                userId: "6512a4c42a6759c77211662e",
            });

            await userCacheModel.create({
                userId: "6512a4c42a6759c772116456",
            });

            await userCacheModel.create({
                userId: "6512a4c42a6759c772115342",
            });

            // Arrange
            const data = {
                userId: "6512a4c42a6759c772115342",
                projectId: subsetion._id,
                role: Roles.CONSULTANT,
            };

            const accessToken = jwks.token({
                sub: "6512a4c42a6759c77211660e",
                role: Roles.COMPANY,
            });

            // Act
            const response = await request(app)
                .post("/resources/add-in-subsection")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(data);

            // Assert
            expect(response.statusCode).toBe(201);
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
        });
        it("should store resource data and isApproved is to be true", async () => {
            const newData = await projectModel.create({
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                companyId: "651d94b37c81f740f30892de",
                createdBy: "6512a4c42a6759c772116456",
                resources: [
                    {
                        userId: "6512a4c42a6759c772116456",
                        userRole: Roles.ADMIN,
                        isApproved: true,
                        status: ResourcesStatus.ACTIVE,
                    },
                    {
                        userId: "6512a4c42a6759c772115342",
                        userRole: Roles.CONSULTANT,
                        isApproved: true,
                        status: ResourcesStatus.ACTIVE,
                    },
                ],
            });

            const subsetion = await subSectionModel.create({
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                projectId: newData._id,
                isActive: true,
                createdBy: "6512a4c42a6759c77211662e",
                resources: [
                    {
                        userId: "6512a4c42a6759c77211662e",
                        userRole: Roles.ADMIN,
                        isApproved: true,
                        status: ResourcesStatus.ACTIVE,
                    },
                ],
            });

            // Arrange
            const data = {
                userId: "6512a4c42a6759c772115342",
                projectId: subsetion._id,
                role: Roles.CONSULTANT,
            };

            const accessToken = jwks.token({
                sub: "6512a4c42a6759c77211660e",
                role: Roles.COMPANY,
            });

            // Act
            const response = await request(app)
                .post("/resources")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(data);

            const project: Project | null = await subSectionModel.findById(
                newData._id,
            );

            if (!project) {
                return;
            }

            // Assert
            expect(response.statusCode).toBe(201);
            expect(project?.resources[1].isApproved).toBe(true);
            expect(project?.resources[1].status).toBe(ResourcesStatus.PENDING);
            expect(project?.resources[1].userRole).toBe(Roles.CONSULTANT);
            expect(response.body).toHaveProperty("result");
            expect(response.body.result).toHaveProperty("_id");
            expect(response.body.result).toHaveProperty("projectName");
            expect(response.body.result).toHaveProperty(
                "matchedResourcesProject",
            );
            expect(response.body.result).toHaveProperty("matchingSubProjects");
            expect(response.body.result).toHaveProperty(
                "notMatchingSubProjects",
            );
        });
    });
});
