import express from "express";
import { countPackage, createPackage, deletePackage, getAllModules, getAllPackages, getPackageById, updatePackageById } from "../../controller/admin/package.controller.js";
import errorHandler from "../../middleware/errorhandler.js";

const packageRouter = express.Router();

packageRouter.post("/", createPackage);
packageRouter.get("/modules", getAllModules);
packageRouter.get("/count", countPackage);
packageRouter.get("/:id", getPackageById);
packageRouter.get("/", getAllPackages);
packageRouter.put("/:id", updatePackageById);
packageRouter.delete("/:id", deletePackage);

packageRouter.use(errorHandler);

export default packageRouter;
