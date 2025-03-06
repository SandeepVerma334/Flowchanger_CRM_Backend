import { Router } from "express";
const branchRouter = Router();

import { createBranch, getAllBranches, deleteBranch, updateBranch, searchBranch, branchCount, deleteBranchInBulk } from "../../controller/admin/branch.controller.js";
import { authorizationMiddleware } from "../../middleware/auth.js";

branchRouter.post("/", authorizationMiddleware, createBranch);
branchRouter.get("/", authorizationMiddleware, getAllBranches);
branchRouter.put("/:id", authorizationMiddleware, updateBranch);
branchRouter.delete("/bulk-delete", authorizationMiddleware, deleteBranchInBulk);
branchRouter.delete("/:id", authorizationMiddleware, deleteBranch);
branchRouter.get("/search", authorizationMiddleware, searchBranch);
branchRouter.get("/count", authorizationMiddleware, branchCount);

export default branchRouter;