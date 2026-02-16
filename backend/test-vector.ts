// test-vector.ts
import path from "path";
import fs from "fs";
import { similaritySearch } from "./src/vectorstore/faiss"

async function test() {
    console.log("🔍 Searching for 'click'...");

    try {
        // Search for a common word in your course
        const results = await similaritySearch("how to search videos");

        console.log("\n✅ FOUND RESULTS:");
        results.forEach((doc, i) => {
            console.log(`\n--- Result ${i + 1} ---`);
            console.log(`Content: ${doc.pageContent}`);
            console.log(`Metadata:`, doc.metadata);
        });

    } catch (e) {
        console.error("❌ Error:", e);
    }
}

test();
// const STORE_PATH = "./faiss_index"; // This must match the path in your faiss.ts
// const resetStore = () => {
//     try {
//         const fullPath = path.resolve(STORE_PATH);

//         if (fs.existsSync(fullPath)) {
//             // Recursive: true deletes the folder and everything inside it
//             fs.rmSync(fullPath, { recursive: true, force: true });
//             console.log(`✅ FAISS storage deleted successfully at: ${fullPath}`);
//         } else {
//             console.log(`⚠️ No FAISS storage found at: ${fullPath}`);
//         }
//     } catch (error) {
//         console.error("❌ Failed to delete FAISS storage:", error);
//     }
// }
// resetStore();