import { Router } from "express";
import { embedDocs, searchDocs } from "../controllers/vectorController";

const router = Router();

router.post("/embed", embedDocs);
router.post("/search", searchDocs);

export default router;
