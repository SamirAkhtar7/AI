import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";


export const authUser = async (req, res,next) => {
   try {
     const token =
       req.cookies?.token || req.headers.authorization?.split(" ")[1];
     if (!token) {
       return res
         .status(401)
         .json({ error: "Authentication token is missing. Please log in." });
       }
       
       const isBlackListed = await redisClient.get(token);
       if (isBlackListed) {
           res.cookies('token', '');
            return res
              .status(401)
              .json({ error: "Invalid token." });
       }

     const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use process.env.JWT_SECRET
     req.user = decoded;
     next();
   } catch (err) {
     if (err.name === "JsonWebTokenError") {
       return res
         .status(401)
         .json({ error: "Invalid token. Please log in again." });
     } else if (err.name === "TokenExpiredError") {
       return res
         .status(401)
         .json({ error: "Token has expired. Please log in again." });
     }
     else {
       return res.status(400).json({
         error: " Unauthorized user.",
         details: err.message, // Optionally include error details for debugging
       });
     }
   }
}