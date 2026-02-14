import { Request, Response, NextFunction } from "express";
import { generateChat } from "../services/groqService";

export const chatCompletion = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { messages } = req.body;
        if (!messages) {
            return res.status(400).json({ error: "Missing messages array" });
        }
        const result = await generateChat(messages);
        res.json({ result });
    } catch (err) {
        next(err);
    }
};
