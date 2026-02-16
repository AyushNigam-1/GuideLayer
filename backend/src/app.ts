import express from "express";
import llmRoutes from "./routes/llmRoutes";
import vectorRoutes from "./routes/vectorRoutes";
import { errorHandler } from "./middleware/errorHanlder";

const app = express();

// parse JSON
app.use(express.json());

// put all routes under /api
app.use("/api", llmRoutes);
app.use("/api", vectorRoutes);

// error handling
app.use(errorHandler);

export default app;
