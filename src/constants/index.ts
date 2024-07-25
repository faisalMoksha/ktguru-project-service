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
