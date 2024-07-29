import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import projectRouter from "./routes/project";
import subSectionRouter from "./routes/sub-section";
import resourcesRouter from "./routes/resources";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Welcome to Auth Service");
});

app.use("/project", projectRouter);
app.use("/sub-section", subSectionRouter);
app.use("/resources", resourcesRouter);

app.use(globalErrorHandler);

export default app;
