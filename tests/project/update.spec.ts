import request from "supertest";
import app from "../../src/app";
import mongoose from "mongoose";
import { Config } from "../../src/config";
import createJWKSMock from "mock-jwks";
import projectModel from "../../src/models/project/projectModel";
import { Roles } from "../../src/constants";

describe("PATCH /project/update", () => {
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
            const data = {
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                companyId: "651d94b37c81f740f30892de",
                createdBy: "6512a4c42a6759c77211660e",
            };

            const savedData = await projectModel.create({
                ...data,
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
                .patch(`/project/${savedData._id}`)
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
            const data = {
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                companyId: "651d94b37c81f740f30892de",
                createdBy: "6512a4c42a6759c77211660e",
            };

            const savedData = await projectModel.create({
                ...data,
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
                .patch(`/project/${savedData._id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(updateData);

            const findData = await projectModel.find();

            // Assert
            expect(response.body).toHaveProperty("data");
            expect(findData[0].projectName).toBe(updateData.projectName);
            expect(findData[0].projectDesc).toBe(updateData.projectDesc);
            expect(findData[0].technology).toBe(updateData.technology);
        });
    });
});
