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
    createdAt: Date;
}

export interface ProjectResource {
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string;
        id: string;
    };
    userRole: string;
    isApproved: boolean;
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

export interface AddUserInProject {
    userId: string;
    projectId: string;
    role?: string;
}

export interface AddResourcePayload {
    email: string;
    companyId?: string;
    role?: string;
    projectId?: string;
}

export interface VerificationToken {
    userId: string;
    addedBy: mongoose.Types.ObjectId;
    token: string;
    projectId: string;
    chatId: mongoose.Types.ObjectId;
    companyId: string;
    createdAt: Date;
}

export interface SignupUser {
    firstName: string;
    lastName: string;
    password: string;
    userId: string;
    companyId: string | null;
}
