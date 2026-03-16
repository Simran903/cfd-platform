import { Router } from "express";
import { closeTrade, openTrade } from "../controllers/trade.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/open", authMiddleware, openTrade);
router.post("/close", authMiddleware, closeTrade);

export default router;
