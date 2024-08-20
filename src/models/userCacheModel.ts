import mongoose from "mongoose";
import { UserCache } from "../types";

const userSchema = new mongoose.Schema<UserCache>(
    {
        userId: {
            type: String,
            require: true,
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        avatar: {
            type: String,
        },
    },
    { timestamps: true },
);

export default mongoose.model<UserCache>("UserCache", userSchema, "userCache");
