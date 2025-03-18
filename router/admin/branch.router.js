import { Router } from "express";
const branchRouter = Router();

import { authorizationMiddleware } from "../../middleware/auth.js";
import { bulkDeleteBranches, countBranches, createBranch, deleteBranch, getAllBranches, searchBranch, updateBranch } from "../../controller/admin/branch.controller.js";

branchRouter.post("/", authorizationMiddleware, createBranch);
branchRouter.get("/", authorizationMiddleware, getAllBranches);
branchRouter.put("/:id", authorizationMiddleware, updateBranch);
branchRouter.delete("/bulk-delete", authorizationMiddleware, bulkDeleteBranches);
branchRouter.delete("/:id", authorizationMiddleware, deleteBranch);
branchRouter.get("/search", authorizationMiddleware, searchBranch);
branchRouter.get("/count", authorizationMiddleware, countBranches);

export default branchRouter;