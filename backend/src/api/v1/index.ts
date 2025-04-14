import { Router } from "express";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import serviceRoutes from "./routes/serviceRoutes";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", version: "v1" });
});

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/services", serviceRoutes);

export default router;
