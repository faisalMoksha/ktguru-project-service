import mongoose from "mongoose";
import { ResourcesStatus, Roles } from "../constants";
import { SubSection } from "../types";

const subSectionSchema = new mongoose.Schema<SubSection>(
    {
        projectName: {
            type: String,
        },
        projectDesc: {
            type: String,
        },
        technology: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        resources: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                },
                userRole: {
                    type: String,
                    default: Roles.CONSULTANT,
                },
                isApproved: {
                    type: Boolean,
                    default: false,
                },
                status: {
                    type: String,
                    enum: [
                        ResourcesStatus.PENDING,
                        ResourcesStatus.ACTIVE,
                        ResourcesStatus.REMOVED_BY_ADMIN,
                        ResourcesStatus.REJECTED_BY_USER,
                    ],
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true },
);

// Created a compound index on projectId, resources.userId, and resources.isApproved
subSectionSchema.index({
    projectId: 1,
    "resources.userId": 1,
    "resources.isApproved": 1,
});

export default mongoose.model<SubSection>("SubSection", subSectionSchema);
