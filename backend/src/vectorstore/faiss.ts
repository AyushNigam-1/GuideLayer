import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";
import fs from "fs";

const STORE_PATH = "./faiss_index";

// Local Ollama embedding model
const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://localhost:11434"
});

export type DocInput = {
    text: string;
    metadata?: Record<string, any>;
};

// CREATE + SAVE
export const createFaissStore = async (docs: DocInput[]) => {
    const texts = docs.map(d => d.text);
    const metadatas = docs.map(d => d.metadata ?? {});

    const store = await FaissStore.fromTexts(
        texts,
        metadatas,
        embeddings
    );

    await store.save(STORE_PATH);

    return store;
};

// LOAD EXISTING STORE
export const loadFaissStore = async () => {
    if (!fs.existsSync(STORE_PATH)) {
        throw new Error("FAISS index not found");
    }

    return await FaissStore.load(STORE_PATH, embeddings);
};

// SEARCH
export const similaritySearch = async (query: string, k = 4) => {
    const store = await loadFaissStore();
    const results = await store.similaritySearch(query, k);
    return results;
};
