import projectModel from "../models/projectModel";
import { MessagePayloadProject } from "../types";

export const projectHandler = async (value: string) => {
    try {
        const data: MessagePayloadProject = JSON.parse(value);

        return await projectModel.updateMany(
            {
                companyId: data.data.companyId,
            },
            {
                isActive: data.data.isActive,
            },
        );
    } catch (error) {
        return error;
    }
};
