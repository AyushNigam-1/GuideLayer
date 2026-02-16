import { Request, Response } from "express";
import {
    createFaissStore,
    deleteVectorsById,
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

export const updateDocs = async (req: Request, res: Response) => {
    const { deleteIds, newSteps } = req.body;
    try {
        // 1. Delete Old Vectors (if any)
        if (deleteIds && deleteIds.length > 0) {
            await deleteVectorsById(deleteIds);
        }
        // 2. Add New Vectors (if any)
        if (newSteps && newSteps.length > 0) {
            await createFaissStore(newSteps);
        }
        res.json({ status: "success" });
    } catch (error: any) {
        console.error("Vector update failed:", error);
        res.status(500).json({ error: error.message });
    }
};

export const searchDocs = async (req: Request, res: Response) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: "query required" });
    }

    const results = await similaritySearch(query);

    res.json(results);
};
