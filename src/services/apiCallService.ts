import axios from "axios";
import { Config } from "../config";
import { AddResourcePayload, SignupUser } from "../types";

export class ApiCallService {
    async addUser({ email, role, companyId, projectId }: AddResourcePayload) {
        try {
            const response = await axios.post(
                `${Config.USER_SERVICE_URI}/users/add-resource`,
                {
                    email,
                    role,
                    companyId,
                    projectId,
                },
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw error.response?.data;
            } else {
                throw error;
            }
        }
    }

    async removedFromCompany(
        companyId: string,
        userId: string,
        status: string,
    ) {
        try {
            const response = await axios.post(
                `${Config.USER_SERVICE_URI}/users/remove-company`,
                {
                    companyId,
                    userId,
                    status,
                },
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw error.response?.data;
            } else {
                throw error;
            }
        }
    }

    async getToken(token: string) {
        try {
            const response = await axios.get(
                `${Config.USER_SERVICE_URI}/users/get-token/${token}`,
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw error.response?.data;
            } else {
                throw error;
            }
        }
    }

    async signupUser({
        firstName,
        lastName,
        password,
        userId,
        companyId,
    }: SignupUser) {
        try {
            const response = await axios.post(
                `${Config.USER_SERVICE_URI}/users/signup-resource`,
                {
                    firstName,
                    lastName,
                    password,
                    userId,
                    companyId,
                },
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw error.response?.data;
            } else {
                throw error;
            }
        }
    }

    async getCompanyResourceData(companyId: string) {
        try {
            const response = await axios.get(
                `${Config.USER_SERVICE_URI}/users/company-resource/${companyId}`,
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw error.response?.data;
            } else {
                throw error;
            }
        }
    }

    async deleteToken(tokenId: string) {
        try {
            const response = await axios.get(
                `${Config.USER_SERVICE_URI}/users/delete-token/${tokenId}`,
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw error.response?.data;
            } else {
                throw error;
            }
        }
    }
}
