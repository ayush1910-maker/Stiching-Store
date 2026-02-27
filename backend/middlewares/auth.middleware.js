import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyJWT = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token && req.header("Authorization")) {
      const authHeader = req.header("Authorization");
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided"
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded?._id).select("-password -otp -otp_expired -refreshToken");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired"
      });
    }

    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }
};

export default verifyJWT;
