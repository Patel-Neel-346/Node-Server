import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  console.log(req.cookies);
  const token =
    req.cookies?.refreshToken ||
    (req.headers?.authorization?.split(" ")[0] === "Bearer" &&
      req.headers?.authorization?.split(" ")[1]);

  console.log("Token:", token);

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, "NeelPatel");
    console.log("Decoded:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token." });
  }
};
