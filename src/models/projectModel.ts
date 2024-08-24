import mongoose from "mongoose";
import { Project } from "../types";
import { ResourcesStatus, Roles } from "../constants";

const projectSchema = new mongoose.Schema<Project>(
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
        companyName: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
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
                    default: ResourcesStatus.PENDING,
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

// Created a compound index on resources.userId and resources.isApproved
projectSchema.index({ "resources.userId": 1, "resources.isApproved": 1 });

export default mongoose.model<Project>("Project", projectSchema);
