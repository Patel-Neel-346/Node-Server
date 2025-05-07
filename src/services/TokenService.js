import jwt from "jsonwebtoken";
import RefreshToken from "../models/RefreshTokenModel.js";

class TokenService {
  generateAccessToken(payload) {
    return jwt.sign(payload, "NeelPatel", {
      algorithm: "HS256",
      expiresIn: "1d",
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, "NeelPatel", {
      algorithm: "HS256",
      expiresIn: "7d",
      jwtid: String(payload._id),
    });
  }

  async presistRefreshToken(userId) {
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
