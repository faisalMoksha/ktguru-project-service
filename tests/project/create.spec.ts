import request from "supertest";
import mongoose from "mongoose";
import createJWKSMock from "mock-jwks";
import axios from "axios";
import app from "../../src/app";
import { Config } from "../../src/config";
import { Roles } from "../../src/constants";
import { Project } from "../../src/types";
import projectModel from "../../src/models/projectModel";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("POST /project/create", () => {
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
            // Arrange
            const data = {
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                companyId: "651d94b37c81f740f30892de",
            };

            const accessToken = jwks.token({
                sub: "6512a4c42a6759c77211660e",
                role: Roles.COMPANY,
            });

            // Mock the axios.get call
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    userId: "6512a4c42a6759c77211660e",
                    companyId: "651d94b37c81f740f30892de",
                    planId: "651d94b37c81f740f30892ce",
                    isActive: true,
                    paymentMode: "Stripe",
                    planDuration: 6,
                    stripeSessionURL: "string",
                    stripeSessionId: "string",
                    stripeInvoiceId: "string",
                    stripeInvoiceURL: "string",
                    currency: "usd",
                    amount: 785,
                    stripePlanId: "string",
                    planStartDate: "string",
                    planEndDate: "string",
                },
            });

            // Mock the axios.get call
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    companyName: "Company-name",
                    teamsData: [],
                },
            });

            // Act
            const response = await request(app)
                .post("/project")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(data);

            // Assert
            expect(response.statusCode).toBe(201);
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
            expect(response.body).toHaveProperty("data");
            expect(response.body).toHaveProperty(
                "message",
                "Successfuly project created",
            );
            expect(mockedAxios.get).toHaveBeenCalledWith(
                `${Config.USER_SERVICE_URI}/users/company-resource/${data.companyId}`,
            );
        });
        it("should persist the project data in the database", async () => {
            // Arrange
            const data = {
                projectName: "M-Attendes",
                projectDesc: "This is project description",
                technology: "Dart",
                companyId: "651d94b37c81f740f30892de",
            };

            const accessToken = jwks.token({
                sub: "6512a4c42a6759c77211660e",
                role: Roles.COMPANY,
            });

            // Mock the axios.get call
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    userId: "6512a4c42a6759c77211660e",
                    companyId: "651d94b37c81f740f30892de",
                    planId: "651d94b37c81f740f30892ce",
                    isActive: true,
                    paymentMode: "Stripe",
                    planDuration: 6,
                    stripeSessionURL: "string",
                    stripeSessionId: "string",
                    stripeInvoiceId: "string",
                    stripeInvoiceURL: "string",
                    currency: "usd",
                    amount: 785,
                    stripePlanId: "string",
                    planStartDate: "string",
                    planEndDate: "string",
                },
            });

            // Mock the axios.get call
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    companyName: "Company-name",
                    teamsData: [],
                },
            });

            // Act
            await request(app)
                .post("/project")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(data);

            // Assert
            const projects: Project[] = await projectModel.find();

            expect(projects).toHaveLength(1);
            expect(projects[0].projectName).toBe(data.projectName);
            expect(projects[0].projectDesc).toBe(data.projectDesc);
            expect(projects[0].technology).toBe(data.technology);
            expect(projects[0].isActive).toBe(true);
        });
    });
});
