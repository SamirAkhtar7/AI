import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  body("name").isLength({min:3}).withMessage("Name must be at least 3 charactors long "),
  body("email").isEmail().withMessage("Email must be a valid email address "),
  body("password")
    .isLength({ min: 8 })
    .withMessage("password must be at least 8 characters long"),
  userController.createUserController
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Email must be a valid email address"),
  body("password")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 characters long"),
  userController.loginController
);

router.get(
  "/profile",
  authMiddleware.authUser,
  userController.profileController
);

router.get(
  "/logout",
  authMiddleware.authUser,
  userController.loggoutController
);

router.get('/all',authMiddleware.authUser,userController.getAllUsersControoler)
export default router;

