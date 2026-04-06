import { Router } from "express";
import {
  logout,
  verifyMagicAuth,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/magic/verify", verifyMagicAuth);
router.post("/logout", authMiddleware, logout);

export default router;