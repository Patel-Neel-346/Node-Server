import jwt from "jsonwebtoken";
import RefreshToken from "../models/RefreshTokenModel.js";
import { config } from "../Config/index.js";

class TokenService {
  generateAccessToken(payload) {
    return jwt.sign(payload, config.JWT_SECRET_ACCESS_TOKEN, {
      algorithm: "HS256",
      expiresIn: config.JWT_EXPIRES_IN,
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, config.JWT_EXPIRES_REFRESH_SECRET, {
      algorithm: "HS256",
      expiresIn: config.JWT_EXPIRES_REFRESH_EXPIRES_IN,
      jwtid: String(payload.id),
    });
  }

  async persistRefreshToken(userId) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const refreshToken = await RefreshToken.create({ user: userId, expiresAt });
    return refreshToken;
  }

  async deleteRefreshToken(tokenId) {
    await RefreshToken.deleteOne({ _id: tokenId });
  }
}

const tokenService = new TokenService();
export default tokenService;
