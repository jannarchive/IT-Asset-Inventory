import express from "express";
import * as AuthController from "../controllers/AuthController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// Public routes
router.post("/login", AuthController.login);
router.post("/oauth-login", AuthController.oauthLogin);
router.post("/logout", AuthController.logout);

// Protected routes
router.get("/user", authenticateToken, AuthController.getCurrentUser);
router.get("/users", authenticateToken, AuthController.getAllUsers);

export default router;
