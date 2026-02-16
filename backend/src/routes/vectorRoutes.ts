import { Router } from "express";
import { embedDocs, searchDocs, updateDocs, } from "../controllers/vectorController";

const router = Router();

router.post("/embed", embedDocs);
router.post("/search", searchDocs);
router.post("/update", updateDocs)

export default router;
