import { Router } from "express";
import { body } from "express-validator";
import * as projectController from "../controllers/project.controller.js";
import * as authMiddleWare from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  authMiddleWare.authUser,
  body("name").isString().withMessage("Name is required"),
  projectController.createProjectController
);

router.get("/all", authMiddleWare.authUser, projectController.getAllProject);

router.put(
  "/add-user",
  authMiddleWare.authUser,
  body("projectId").isString().withMessage("Project ID id required"),
  body("users")
    .isArray({ min: 1 })
    .withMessage("Users must be an array of strings")
    .bail()
    .custom((users) => users.every((user) => typeof user === "string"))
    .withMessage("Each user must be a string"),
  projectController.addUserToProject
);

router.get(
  "/get-project/:projectId",
  authMiddleWare.authUser,
  projectController.getProjectById
);

router.put(
  "/update-file-tree",
  authMiddleWare.authUser,
  body("projectId").isString().withMessage("Project ID is required"),
  body("fileTree").isObject().withMessage("File tree is required "),
  projectController.updateFileTree
);

router.delete(
  "/delete/:projectId",
  authMiddleWare.authUser,
  body("projectId").isString().withMessage("Project ID is required"),
  projectController.deleteProject
);

export default router;
