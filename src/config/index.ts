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
    JWKS_URI,
    USER_SERVICE_URI,
    SUBSCRIPTION_SERVICE_URI,
    KAFKA_BROKER,
    KAFKA_SASL_USER_NAME,
    KAFKA_SASL_PASSWORD,
} = process.env;

export const Config = {
    NODE_ENV,
    PORT,
    MONGO_URI,
    FRONTEND_URL,
    JWKS_URI,
    USER_SERVICE_URI,
    SUBSCRIPTION_SERVICE_URI,
    KAFKA_BROKER,
    KAFKA_SASL_USER_NAME,
    KAFKA_SASL_PASSWORD,
};
