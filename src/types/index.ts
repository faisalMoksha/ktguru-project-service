import { Request } from "express";
import mongoose from "mongoose";

export type AuthCookie = {
    accessToken: string;
    refreshToken: string;
};

export interface AuthRequest extends Request {
    auth: {
        sub: string;
        role: string;
    };
}

export interface Resources {
    userId: mongoose.Types.ObjectId;
    userRole: string;
    isApproved: boolean;
    status: string;
}

export interface Project {
    _id: string;
    projectName: string;
    projectDesc: string;
    technology: string;
    isActive: boolean;
    companyId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    resources: Resources[];
}

export interface SubSection {
    _id: string;
    projectName: string;
    projectDesc: string;
    technology: string;
    isActive: boolean;
    projectId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    resources: Resources[];
}

export interface RequestBody {
    _id?: string;
    projectName?: string;
    projectDesc?: string;
    technology?: string;
    companyId?: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
}
