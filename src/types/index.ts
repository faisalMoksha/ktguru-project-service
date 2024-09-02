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
    _id: string;
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string;
        userId: string;
    };
    projectName: string;
    userRole: string;
    isApproved: boolean;
    status: string;
    createdAt: Date;
}

export interface Project {
    _id: string;
    projectName: string;
    projectDesc: string;
    technology: string;
    companyName: string;
    isActive: boolean;
    companyId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    resources: Resources[];
}

export interface ProjectPayload {
    _id: string;
    projectName: string;
    projectDesc: string;
    technology: string;
    companyName: string;
    isActive: boolean;
    companyId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    resources: {
        userId: {
            _id: string;
            firstName: string;
            lastName: string;
            email: string;
            avatar: string;
            userId: string;
        };
        userRole: string;
        isApproved: boolean;
        status: string;
        createdAt: Date;
    }[];
}

export interface SubSectionPayload {
    _id: string;
    projectName: string;
    projectDesc: string;
    technology: string;
    isActive: boolean;
    projectId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    resources: {
        userId: {
            _id: string;
            firstName: string;
            lastName: string;
            email: string;
            avatar: string;
            userId: string;
        };
        userRole: string;
        isApproved: boolean;
        status: string;
        createdAt: Date;
    }[];
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
    companyName?: string;
    technology?: string;
    companyId?: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
    resource?: Resources[];
    createdBy?: string;
}

export interface AddUserInProject {
    userId: string;
    projectId: string;
    role?: string;
    status?: string;
}

export interface AddResourcePayload {
    email: string;
    companyId?: string;
    role?: string;
    projectId?: string;
    addedBy?: string;
}

export interface VerificationToken {
    userId: string;
    addedBy: mongoose.Types.ObjectId;
    token: string;
    projectId: string;
    chatId: mongoose.Types.ObjectId;
    companyId: string;
    createdAt: Date;
    _id: string;
    role: string;
}

export interface SignupUser {
    firstName: string;
    lastName: string;
    password: string;
    userId: string;
    companyId: string;
    role: string;
}

export interface UserCache {
    userId: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    avatar: string;
    email: string;
}

export interface MessagePayloadUser {
    event_type: string;
    data: UserCache;
}

export interface MessagePayloadProject {
    event_type: string;
    data: { isActive: boolean; companyId: string };
}

export interface ValueFromApiCall {
    userId: string;
    url: string;
    declineURL: string;
    companyName: string;
}

export interface Plan {
    planName: string;
    planAmountUSD: number;
    planAmountURO: number;
    planAmountGBP: number;
    totalProject: number;
    totalConsultant: number;
    isAnnual: boolean;
    isCustomized: boolean;
    freeTrial: boolean;
    trialDuration: number;
    title: string;
    features: [string];
    isActive: boolean;
    stripePlanId: string;
    planStartDate: string;
    planEndDate: string;
    addedBy: string;
    createdAt: Date;
    updatedAt: Date;
    _id: string;
}

export interface Subscription {
    userId: mongoose.Types.ObjectId;
    companyId: string;
    planId: Plan;
    isActive: boolean;
    paymentMode: string;
    planDuration: string;
    stripeSessionURL: string;
    stripeSessionId: string;
    stripeInvoiceId: string;
    stripeInvoiceURL: string;
    currency: string;
    amount: number;
    stripePlanId: string;
    planStartDate: string;
    planEndDate: string;
}
