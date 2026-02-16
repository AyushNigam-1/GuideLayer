import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Document } from "@langchain/core/documents"; // <--- IMPORT THIS
import fs from "fs";

const STORE_PATH = "./faiss_index";

const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://localhost:11434"
});

// GLOBAL CACHE
let vectorStoreInstance: FaissStore | null = null;

export type DocInput = {
    text: string;
    metadata?: Record<string, any>;
};

// HELPER: Initialize Store
const getStore = async () => {
    if (vectorStoreInstance) {
        return vectorStoreInstance;
    }

    if (fs.existsSync(STORE_PATH)) {
        console.log("📂 Loading FAISS index from disk...");
        vectorStoreInstance = await FaissStore.load(STORE_PATH, embeddings);
    } else {
        console.log("✨ Creating new in-memory FAISS store...");
        vectorStoreInstance = await FaissStore.fromTexts(
            ["__init__"],
            [{ id: "init" }],
            embeddings
        );
    }
    return vectorStoreInstance;
};

export const createFaissStore = async (docs: { id: string, text: string, metadata: any }[]) => {
    const store = await getStore();

    const documents = docs.map(d => new Document({
        pageContent: d.text,
        metadata: d.metadata
    }));

    const ids = docs.map(d => d.id);

    await store.addDocuments(documents, { ids: ids });

    await store.save(STORE_PATH);
}

export const deleteVectorsById = async (ids: string[]) => {
    const store = await getStore();
    if (ids.length === 0) return;

    console.log(`🗑️ Deleting ${ids.length} vectors by ID...`);

    await store.delete({ ids: ids });

    await store.save(STORE_PATH);
};

// SEARCH
export const similaritySearch = async (query: string, k = 4, filter?: object) => {
    const store = await getStore();
    const results = await store.similaritySearch(query, k, filter);
    return results.filter(r => r.pageContent !== "__init__");
};