import jwt from "jsonwebtoken";
import { ApiError } from "../helpers/ApiError.js";
import { config } from "../Config/index.js";

export const authMiddleware = (req, res, next) => {
  try {
    // Try to get token from cookies first, then from Authorization header
    const accessToken =
      req.cookies?.accessToken ||
      (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : null);

    // console.log(accessToken);

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. No token provided.",
      });
    }

    try {
      const decoded = jwt.verify(accessToken, config.JWT_SECRET_ACCESS_TOKEN);
      req.user = decoded;
      next();
    } catch (error) {
      // If token is expired, suggest using the refresh token endpoint
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token expired. Please refresh your token.",
          code: "TOKEN_EXPIRED",
        });
      }

      return res.status(403).json({
        success: false,
        message: "Invalid token.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};
