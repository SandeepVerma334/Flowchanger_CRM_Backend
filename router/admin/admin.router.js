import express from "express";

import {adminSignup, getAllUsers, searchUsers, getUserById, deleteUserById} from "../../controller/admin/admin.controller.js";
import errorHandler from "../../middleware/errorhandler.js";

const adminRouter = express.Router();

adminRouter.get("/search", searchUsers);
adminRouter.get("/:id", getUserById);
adminRouter.delete("/:id", deleteUserById)
adminRouter.post("/create", adminSignup);
adminRouter.get("/", getAllUsers);

adminRouter.use(errorHandler);

export default adminRouter;