import { Request, Response } from "express";
import {
    createFaissStore,
    similaritySearch
} from "../vectorstore/faiss";

export const embedDocs = async (req: Request, res: Response) => {
    const { documents } = req.body;

    if (!documents || !Array.isArray(documents)) {
        return res.status(400).json({ error: "documents array required" });
    }

    await createFaissStore(documents);

    res.json({ status: "Documents embedded successfully" });
};

export const searchDocs = async (req: Request, res: Response) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: "query required" });
    }

    const results = await similaritySearch(query);

    res.json(results);
};
