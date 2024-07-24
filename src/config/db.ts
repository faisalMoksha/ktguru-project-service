import mongoose from "mongoose";
import logger from "./logger";
import { Config } from ".";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            logger.info("Connected to database successfully");
        });

        mongoose.connection.on("error", (err) => {
            logger.error("Error in connecting to database.", err);
        });

        await mongoose.connect(Config.MONGO_URI!);
    } catch (err) {
        logger.error("Error in connecting to database.", err);
        process.exit(1);
    }
};

export default connectDB;
