import request from "supertest";
import mongoose from "mongoose";
import axios from "axios";
import app from "../../src/app";
import { Config } from "../../src/config";
import { ResourcesStatus, Roles } from "../../src/constants";
import projectModel from "../../src/models/projectModel";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("POST /resources/verify", () => {
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

            // Mock the axios.get call
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    _id: "wedwbdkjwednkjewndkwe",
                    userId: "6512a4c42a6759c77211660e",
                    projectId: newData._id,
                    companyId: null,
                },
            });

            mockedAxios.get.mockResolvedValueOnce({
                data: {},
            });

            // Act
            const response = await request(app).get(
                "/resources/verify/wedwbdkjwednkjewndkwe",
            );

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
            expect(mockedAxios.get).toHaveBeenNthCalledWith(
                1,
                `${Config.USER_SERVICE_URI}/users/get-token/wedwbdkjwednkjewndkwe`,
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

            const response = await request(app).get(
                "/resources/verify/invalidToken",
            );

            expect(response.statusCode).toBe(500);
        });
    });
});
