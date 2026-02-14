import { Router } from "express";
import { chatCompletion } from "../controllers/llmControllers";

const router = Router();

router.post("/chat", chatCompletion);

export default router;
