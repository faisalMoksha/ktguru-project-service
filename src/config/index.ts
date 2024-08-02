import { config } from "dotenv";
import path from "path";

config({
    path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || "dev"}`),
});

const {
    NODE_ENV,
    PORT,
    MONGO_URI,
    FRONTEND_URL,
    SUPPORT_PORTAL_URL,
    BACKEND_URL,
    JWKS_URI,
    USER_SERVICE_URI,
} = process.env;

export const Config = {
    NODE_ENV,
    PORT,
    MONGO_URI,
    FRONTEND_URL,
    SUPPORT_PORTAL_URL,
    BACKEND_URL,
    JWKS_URI,
    USER_SERVICE_URI,
};
