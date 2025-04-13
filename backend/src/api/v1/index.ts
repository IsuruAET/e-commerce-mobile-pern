import { Router } from "express";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", version: "v1" });
});

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);

export default router;
