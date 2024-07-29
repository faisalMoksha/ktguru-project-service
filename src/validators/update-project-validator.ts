import { checkSchema } from "express-validator";

export default checkSchema({
    projectName: {
        trim: true,
        isString: true,
        optional: true,
    },
    projectDesc: {
        trim: true,
        isString: true,
        optional: true,
    },
    technology: {
        trim: true,
        isString: true,
        optional: true,
    },
    id: {
        in: ["params"],
        notEmpty: {
            errorMessage: "Project Id is required",
        },
    },
    projectId: {
        trim: true,
        optional: true,
        isString: true,
        errorMessage: "Project Id should be string!",
    },
});
