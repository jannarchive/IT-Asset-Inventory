import express from 'express';
import * as authController from '../controllers/AuthController.js';
import { authenticateToken } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// Public routes
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// Protected routes
router.get("/user", authenticateToken, authController.getCurrentUser);
router.get("/users", authenticateToken, authController.getAllUsers);

export default router;
