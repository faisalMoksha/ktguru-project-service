import request from "supertest";
import app from "../../src/app";
import mongoose from "mongoose";
import { Config } from "../../src/config";
import createJWKSMock from "mock-jwks";
import { ResourcesStatus, Roles } from "../../src/constants";
import subSectionModel from "../../src/models/subSectionModel";

describe("GET /subsection/get-all", () => {
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
        it("should return the 201 status code and reurn project data", async () => {
            // Arrange
            const data = {
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                projectId: "6512a4c42a6759c77211660e",
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
            };

            await subSectionModel.create({
                ...data,
            });

            const accessToken = jwks.token({
                sub: "6512a4c42a6759c77211662e",
                role: Roles.COMPANY,
            });

            // Act
            const response = await request(app)
                .get(`/sub-section/6512a4c42a6759c77211660e`)
                .set("Cookie", [`accessToken=${accessToken}`]);

            // Assert
            expect(response.statusCode).toBe(200);
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
            expect(response.body).toHaveProperty("data");
            expect(response.body.data).toHaveLength(1);
        });
    });
});
