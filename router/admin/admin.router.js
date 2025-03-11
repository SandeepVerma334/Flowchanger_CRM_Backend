import express from "express";

import { adminLogin, adminPasswordResetLink, adminResetPassword, adminSignup, deleteUserById, getAllUsers, getUserById, searchUsers, sendOTP, updateAdminProfile, verifyOTP } from "../../controller/admin/admin.controller.js";
import errorHandler from "../../middleware/errorhandler.js";

const adminRouter = express.Router();

adminRouter.get("/search", searchUsers);
adminRouter.post("/forgot", adminPasswordResetLink)
adminRouter.patch("/reset", adminResetPassword)
adminRouter.get("/:id", getUserById);
adminRouter.delete("/:id", deleteUserById)
adminRouter.post("/signup", adminSignup);
adminRouter.post("/login", adminLogin);
adminRouter.put("/detail", updateAdminProfile);
adminRouter.put("/verify", verifyOTP);
adminRouter.put("/send-otp", sendOTP);
adminRouter.get("/", getAllUsers);

adminRouter.use(errorHandler);

export default adminRouter;