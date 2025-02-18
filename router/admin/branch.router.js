import { Router } from "express";
const branchRouter = Router();

import { createBranch, getAllBranches } from "../../controller/admin/branch.controller.js";

branchRouter.post("/", createBranch);
branchRouter.get("/", getAllBranches);

export default branchRouter;