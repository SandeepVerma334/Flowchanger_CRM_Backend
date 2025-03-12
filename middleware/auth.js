import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken"

const authorizationMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ error: "No token provided or invalid format" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decodedToken)
    if (!decodedToken) {
      return res
        .status(401)
        .json({ error: "Invalid token or authorization failed" });
    }
    req.userId = decodedToken.id;
    next();
  } catch (error) {
    res.status(401).json({
      error: "Invalid token or authorization failed",
    });
  }
};

export {authorizationMiddleware}