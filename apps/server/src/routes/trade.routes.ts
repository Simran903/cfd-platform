import { Router } from "express";
import { openTrade } from "../controllers/trade.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/open", openTrade);

export default router;
