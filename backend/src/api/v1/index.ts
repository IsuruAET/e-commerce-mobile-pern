import { Router } from "express";
import authRoutes from "./routes/authRoutes";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", version: "v1" });
});

router.use("/auth", authRoutes);

export default router;
