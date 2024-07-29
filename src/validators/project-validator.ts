import { checkSchema } from "express-validator";

export default checkSchema({
    projectName: {
        trim: true,
        notEmpty: true,
        errorMessage: "Project Name is required!",
    },
    projectDesc: {
        trim: true,
        notEmpty: true,
        errorMessage: "Project Description is required!",
    },
    technology: {
        trim: true,
        notEmpty: true,
        errorMessage: "Technology is required!",
    },
    companyId: {
        trim: true,
        optional: true,
        isString: true,
        errorMessage: "Company Id should be string!",
    },
    projectId: {
        trim: true,
        optional: true,
        isString: true,
        errorMessage: "Project Id should be string!",
    },
});
