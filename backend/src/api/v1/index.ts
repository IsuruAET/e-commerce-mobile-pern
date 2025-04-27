import { Router } from "express";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import userRoutes from "./routes/userRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import roleRoutes from "./routes/roleRoutes";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", version: "v1" });
});

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/services", serviceRoutes);
router.use("/users", userRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/roles", roleRoutes);

export default router;
