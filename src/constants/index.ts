export const Roles = {
    SUPER_ADMIN: "superAdmin",
    ADMIN: "admin",
    COMPANY: "company",
    COMPANY_ADMIN: "companyAdmin",
    PROJECT_ADMIN: "projectAdmin",
    CONSULTANT: "consultant",
} as const;

export const ResourcesStatus = {
    PENDING: "pending",
    ACTIVE: "active",
    REMOVED_BY_ADMIN: "removedByAdmin",
    REJECTED_BY_USER: "rejectedByUser",
} as const;

export const KafKaTopic = {
    User: "user",
    Chat: "chat",
    Mail: "mail",
} as const;

export enum ChatEvents {
    CHAT_CREATE = "CHAT_CREATE",
    CHAT_UPDATE = "CHAT_UPDATE",
    ADD_USER_PROJECT_CHAT = "ADD_USER_PROJECT_CHAT",
    IS_APPROVED = "IS_APPROVED", // Boolean value
}
