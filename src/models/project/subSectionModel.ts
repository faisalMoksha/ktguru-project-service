import mongoose from "mongoose";
import { ResourcesStatus, Roles } from "../../constants";
import { SubSection } from "../../types";

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
            ref: "User",
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
                    ref: "User",
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
            },
        ],
    },
    { timestamps: true },
);

export default mongoose.model<SubSection>("SubSection", subSectionSchema);
