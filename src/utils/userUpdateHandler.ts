import userCacheModel from "../models/userCacheModel";
import { MessagePayload } from "../types";

export const handleUserUpdate = async (value: string) => {
    try {
        const user: MessagePayload = JSON.parse(value);

        return await userCacheModel.updateOne(
            {
                userId: user.data.userId,
            },
            {
                $set: {
                    firstName: user.data.firstName,
                    lastName: user.data.lastName,
                    avatar: user.data.avatar,
                },
            },
            {
                upsert: true, // agar database mai record hai to data update ho jaye ga ya fir new data insert hojaye ga
            },
        );
    } catch (error) {
        return error;
    }
};
