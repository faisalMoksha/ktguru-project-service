import request from "supertest";
import mongoose from "mongoose";
import createJWKSMock from "mock-jwks";
import app from "../../src/app";
import { Config } from "../../src/config";
import { ResourcesStatus, Roles } from "../../src/constants";
import projectModel from "../../src/models/projectModel";
import subSectionModel from "../../src/models/subSectionModel";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("POST /resources/remove-company", () => {
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
        it("should removed user from company and project and return valid json response", async () => {
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
                        userRole: Roles.COMPANY_ADMIN,
                        isApproved: true,
                        status: ResourcesStatus.ACTIVE,
                    },
                ],
            });

            await subSectionModel.create({
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
                    },
                    {
                        userId: "6512a4c42a6759c772115342",
                        userRole: Roles.COMPANY_ADMIN,
                        isApproved: true,
                    },
                ],
            });

            // Arrange
            const data = {
                userId: "6512a4c42a6759c772115342",
                companyId: newData.companyId,
            };

            // Mock the axios.get call
            mockedAxios.post.mockResolvedValueOnce({
                data: {
                    userId: "6512a4c42a6759c77211660e",
                    url: "http://localhost:5501/url...",
                },
            });

            const accessToken = jwks.token({
                sub: "6512a4c42a6759c77211660e",
                role: Roles.COMPANY,
            });

            // Act
            const response = await request(app)
                .post("/resources/remove-company")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(data);

            const project = await projectModel.findOne({
                resources: {
                    $elemMatch: { userId: data.userId, isApproved: true },
                },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
            expect(project).toBe(null);
        });
    });
});
