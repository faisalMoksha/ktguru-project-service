import request from "supertest";
import mongoose from "mongoose";
import createJWKSMock from "mock-jwks";
import axios from "axios";
import app from "../../src/app";
import { Config } from "../../src/config";
import { ResourcesStatus, Roles } from "../../src/constants";
import projectModel from "../../src/models/projectModel";
import { Project } from "../../src/types";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("POST /resources/add-resources", () => {
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
                ],
            });

            // Arrange
            const data = {
                email: "example@gmail.com",
                projectId: newData._id,
                role: Roles.CONSULTANT,
                // subSectionIds: ["66b1b21fe3db306be0347c53"],
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
                .post("/resources")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(data);

            // Assert
            expect(response.statusCode).toBe(201);
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
            expect(mockedAxios.post).toHaveBeenCalledWith(
                `${Config.USER_SERVICE_URI}/users/add-resource`,
                {
                    email: "example@gmail.com",
                    role: Roles.CONSULTANT,
                    projectId: String(newData._id),
                    companyId: undefined,
                    addedBy: "6512a4c42a6759c77211660e",
                },
            );
        });
        it("should store resource data and isApproved is to be false", async () => {
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
                ],
            });

            // Arrange
            const data = {
                email: "example@gmail.com",
                projectId: newData._id,
                role: Roles.CONSULTANT,
                // subSectionIds: ["66b1b21fe3db306be0347c53"],
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
                .post("/resources")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(data);

            const project: Project | null = await projectModel.findById(
                newData._id,
            );

            if (!project) {
                return;
            }

            // Assert
            expect(response.statusCode).toBe(201);
            expect(project?.resources[1].isApproved).toBe(false);
            expect(project?.resources[1].status).toBe(ResourcesStatus.PENDING);
            expect(project?.resources[1].userRole).toBe(Roles.CONSULTANT);
        });
    });
});
