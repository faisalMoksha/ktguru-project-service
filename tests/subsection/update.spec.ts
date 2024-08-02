import request from "supertest";
import app from "../../src/app";
import mongoose from "mongoose";
import { Config } from "../../src/config";
import createJWKSMock from "mock-jwks";
import { ResourcesStatus, Roles } from "../../src/constants";
import subSectionModel from "../../src/models/project/subSectionModel";

describe("PATCH /subsection/update", () => {
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
                projectId: "651d94b37c81f740f30892de",
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

            const savedData = await subSectionModel.create({
                ...projectData,
            });

            const accessToken = jwks.token({
                sub: "6512a4c42a6759c77211660e",
                role: Roles.COMPANY,
            });

            const updateData = {
                projectName: "New M-Attendes",
                projectDesc: "This is updated project description",
                technology: ".Net, Dart",
            };

            // Act
            const response = await request(app)
                .patch(`/sub-section/${savedData._id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(updateData);

            // Assert
            expect(response.statusCode).toBe(200);
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });
        it("should return updated project data", async () => {
            // Arrange
            const projectData = {
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                projectId: "651d94b37c81f740f30892de",
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

            const savedData = await subSectionModel.create({
                ...projectData,
            });

            const accessToken = jwks.token({
                sub: "6512a4c42a6759c77211660e",
                role: Roles.COMPANY,
            });

            const updateData = {
                projectName: "New M-Attendes",
                projectDesc: "This is updated project description",
                technology: ".Net, Dart",
            };

            // Act
            const response = await request(app)
                .patch(`/sub-section/${savedData._id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(updateData);

            const findData = await subSectionModel.find();

            // Assert
            expect(response.body).toHaveProperty("data");
            expect(findData[0].projectName).toBe(updateData.projectName);
            expect(findData[0].projectDesc).toBe(updateData.projectDesc);
            expect(findData[0].technology).toBe(updateData.technology);
        });
    });
});
