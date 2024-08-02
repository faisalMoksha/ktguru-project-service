import request from "supertest";
import app from "../../src/app";
import mongoose from "mongoose";
import { Config } from "../../src/config";
import createJWKSMock from "mock-jwks";
import { Roles } from "../../src/constants";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

// Create an instance of MockAdapter for mocking axios requests
const mock = new MockAdapter(axios);

describe("POST /resources/add", () => {
    let jwks: ReturnType<typeof createJWKSMock>;

    beforeEach(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        jwks.start();
        await mongoose.connect(Config.MONGO_URI!);
        await mongoose.connection.db.dropDatabase();

        // Mock the POST request to the user service
        mock.onPost(`${Config.USER_SERVICE_URI}/users/add-resource`).reply(
            201,
            {
                id: "6512a4c42a6759c77211660e",
                email: "iamfaisaal@gmail.com",
            },
        );
    });

    afterEach(async () => {
        await mongoose.connection.close();
        jwks.stop();
        mock.reset();
    });

    describe("Given all fields", () => {
        it("should return the 201 status code and return valid json response", async () => {
            // Arrange
            const data = {
                name: "Faisal",
                email: "iamfaisaal@gmail.com",
                message: "Please join our project",
                projectId: "65c8cada98781c8e4e8df071",
                subSectionIds: [
                    "65c8cada98781c8e4e8df071",
                    "65c8cada98781c8e4e8df071",
                ],
            };

            const accessToken = jwks.token({
                sub: "6512a4c42a6759c77211660e",
                role: Roles.PROJECT_ADMIN,
            });

            // Act
            const response = await request(app)
                .post("/resources")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(data);

            console.log("response.body:", response.body);

            // Assert
            expect(response.statusCode).toBe(201);
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });
    });
});
