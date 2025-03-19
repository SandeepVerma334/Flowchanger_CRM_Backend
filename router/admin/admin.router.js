import express from "express";

import { adminLogin, adminPasswordResetLink, adminResetPassword, adminSignup, countAdmin, deleteUserById, getAllUsers, getUserById, searchUsers, sendOTP, updateAdminProfile, verifyOTP } from "../../controller/admin/admin.controller.js";
import errorHandler from "../../middleware/errorhandler.js";

const adminRouter = express.Router();

adminRouter.get("/search", searchUsers);
adminRouter.post("/forgot", adminPasswordResetLink)
adminRouter.patch("/reset", adminResetPassword)
adminRouter.get("/count", countAdmin)
adminRouter.put("/verify", verifyOTP);
adminRouter.post("/signup", adminSignup);
adminRouter.put("/send-otp", sendOTP);
adminRouter.post("/login", adminLogin);
adminRouter.put("/detail", updateAdminProfile);
adminRouter.get("/", getAllUsers);
adminRouter.get("/:id", getUserById);
adminRouter.delete("/:id", deleteUserById)

adminRouter.use(errorHandler);

export default adminRouter;