import express from "express";
import errorHandler from "../../middleware/errorhandler.js";
import { createPackage, getAllModules, getAllPackages, updatePackageById, getPackageByAdminId } from "../../controller/admin/package.controller.js";

const packageRouter = express.Router();

packageRouter.post("/", createPackage);
packageRouter.get("/:adminId", getPackageByAdminId);
packageRouter.get("/", getAllPackages);
packageRouter.get("/modules", getAllModules);
packageRouter.put("/:id", updatePackageById);

packageRouter.use(errorHandler);

export default packageRouter;
