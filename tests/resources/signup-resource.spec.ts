import request from "supertest";
import mongoose from "mongoose";
import axios from "axios";
import app from "../../src/app";
import { Config } from "../../src/config";
import { ResourcesStatus, Roles } from "../../src/constants";
import projectModel from "../../src/models/projectModel";
import userCacheModel from "../../src/models/userCacheModel";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("POST /resources/signup-resource", () => {
    beforeEach(async () => {
        await mongoose.connect(Config.MONGO_URI!);
        await mongoose.connection.db.dropDatabase();
    });

    afterEach(async () => {
        await mongoose.connection.close();
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
                        userId: "6512a4c42a6759c77211660e",
                        userRole: Roles.CONSULTANT,
                        isApproved: true,
                        status: ResourcesStatus.PENDING,
                    },
                ],
            });

            await userCacheModel.create({
                userId: "6512a4c42a6759c772116456",
            });

            await userCacheModel.create({
                userId: "6512a4c42a6759c77211660e",
            });

            // Arrange
            const data = {
                firstName: "Faisal",
                lastName: "Khan",
                password: "Password@123",
            };

            // Mock the axios.get call
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    _id: "wedwbdkjwednkjewndkwe",
                    userId: "6512a4c42a6759c77211660e",
                    projectId: null,
                    companyId: "651d94b37c81f740f30892de",
                    role: Roles.CONSULTANT,
                },
            });

            mockedAxios.post.mockResolvedValueOnce({
                data: {
                    userId: "6512a4c42a6759c77211660e",
                    projectId: newData._id,
                },
            });

            mockedAxios.get.mockResolvedValueOnce({
                data: {},
            });

            // Act
            const response = await request(app)
                .post("/resources/signup/wedwbdkjwednkjewndkwe")
                .send(data);

            // Assert
            expect(response.statusCode).toBe(201);
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
            expect(mockedAxios.get).toHaveBeenNthCalledWith(
                1,
                `${Config.USER_SERVICE_URI}/users/get-token/wedwbdkjwednkjewndkwe`,
            );

            expect(mockedAxios.post).toHaveBeenCalledWith(
                `${Config.USER_SERVICE_URI}/users/signup-resource`,
                {
                    firstName: "Faisal",
                    lastName: "Khan",
                    password: "Password@123",
                    userId: "6512a4c42a6759c77211660e",
                    companyId: "651d94b37c81f740f30892de",
                    role: Roles.CONSULTANT,
                },
            );

            expect(mockedAxios.get).toHaveBeenNthCalledWith(
                2,
                `${Config.USER_SERVICE_URI}/users/delete-token/wedwbdkjwednkjewndkwe`,
            );
        });
    });

    describe("Given invalid input", () => {
        it("should return 400 status code when token is invalid", async () => {
            mockedAxios.get.mockRejectedValueOnce({
                response: { data: "Invalid token" },
            });

            const response = await request(app)
                .post("/resources/signup/invalidToken")
                .send({
                    firstName: "Test",
                    lastName: "User",
                    password: "Password123!",
                });

            expect(response.statusCode).toBe(500);
        });
        it("should return 400 status code when user signup fails", async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    _id: "tokenId789",
                    userId: "userId789",
                },
            });

            mockedAxios.post.mockRejectedValueOnce({
                response: { data: "User signup failed" },
            });

            const response = await request(app)
                .post("/resources/signup/tokenId789")
                .send({
                    firstName: "Failed",
                    lastName: "User",
                    password: "Password789!",
                });

            expect(response.statusCode).toBe(500);
        });
    });
});
