import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import projectRouter from "./routes/project";
import subSectionRouter from "./routes/sub-section";
import resourcesRouter from "./routes/resources";
import { Config } from "./config";

const app = express();

const ALLOWED_DOMAINS = [Config.FRONTEND_URL, "http://localhost:3002"];
app.use(
    cors({
        origin: ALLOWED_DOMAINS as string[],
    }),
);

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Welcome to Project Service");
});

app.use("/project", projectRouter);
app.use("/sub-section", subSectionRouter);
app.use("/resources", resourcesRouter);

app.use(globalErrorHandler);

export default app;
