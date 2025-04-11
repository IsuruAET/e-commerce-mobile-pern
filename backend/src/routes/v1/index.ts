import { Router } from "express";

const router = Router();

// Import route modules here
// Example: import userRoutes from './user.routes';

// Mount routes here
// Example: router.use('/users', userRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "ok", version: "v1" });
});

export default router;
