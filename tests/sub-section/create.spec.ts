import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app";
import createJWKSMock from "mock-jwks";
import { Config } from "../../src/config";
import subSectionModel from "../../src/models/subSectionModel";
import projectModel from "../../src/models/projectModel";
import { ResourcesStatus, Roles } from "../../src/constants";
import { SubSection } from "../../src/types";

describe("POST /subsection/create", () => {
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
    });

    describe("Given all fields", () => {
        it("should return the 201 status code and reurn valid json response", async () => {
            // Arrange

            const projectData = {
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                companyId: "651d94b37c81f740f30892de",
                createdBy: "6512a4c42a6759c77211660e",
                resources: [
                    {
                        userId: "6512a4c42a6759c77211660e",
                        userRole: Roles.ADMIN,
                        isApproved: true,
                        status: ResourcesStatus.ACTIVE,
                    },
                ],
            };

            const savedData = await projectModel.create({
                ...projectData,
            });

            const data = {
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                projectId: savedData._id,
            };

            const accessToken = jwks.token({
                sub: "6512a4c42a6759c77211660e",
                role: Roles.COMPANY,
            });

            // Act
            const response = await request(app)
                .post("/sub-section")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(data);

            // Assert
            expect(response.statusCode).toBe(201);
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });
        it("should persist the project data in the database", async () => {
            const projectData = {
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                companyId: "651d94b37c81f740f30892de",
                createdBy: "6512a4c42a6759c77211660e",
                resources: [
                    {
                        userId: "6512a4c42a6759c77211660e",
                        userRole: Roles.ADMIN,
                        isApproved: true,
                        status: ResourcesStatus.ACTIVE,
                    },
                ],
            };

            const savedData = await projectModel.create({
                ...projectData,
            });

            const data = {
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                projectId: savedData._id,
            };

            const accessToken = jwks.token({
                sub: "6512a4c42a6759c77211660e",
                role: Roles.COMPANY,
            });

            // Act
            await request(app)
                .post("/sub-section")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(data);

            // Assert
            const projects: SubSection[] = await subSectionModel.find();

            expect(projects).toHaveLength(1);
            expect(projects[0].projectName).toBe(data.projectName);
            expect(projects[0].projectDesc).toBe(data.projectDesc);
            expect(projects[0].technology).toBe(data.technology);
            expect(projects[0].isActive).toBe(true);
        });
    });
});
