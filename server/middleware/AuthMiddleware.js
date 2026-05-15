import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set. Set it in your .env file.");
}

// JWT Authentication Middleware
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Extract from "Bearer <token>"

    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        // Distinguish expired tokens from tampered ones for easier debugging
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ error: "Unauthorized - Token has expired" });
        }
        return res.status(403).json({ error: "Forbidden - Invalid token" });
      }

      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      next();
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Server error" });
  }
};