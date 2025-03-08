import { Router } from "express";
const roleRouter = Router();
import { authorizationMiddleware } from "../../middleware/auth.js";
import { addRole, fetchRole, fetchRoleWithId, updateRole, deleteRole, searchRoleByName, deleteRoleInBulk } from "../../controller/admin/role.controller.js";

roleRouter.post("/", authorizationMiddleware, addRole);
roleRouter.get("/", authorizationMiddleware, fetchRole);
roleRouter.put("/:id", authorizationMiddleware, updateRole);
roleRouter.delete("/bulk-delete", authorizationMiddleware, deleteRoleInBulk);
roleRouter.delete("/:id", authorizationMiddleware, deleteRole);
roleRouter.get("/search", authorizationMiddleware, searchRoleByName);
// roleRouter.get("/count", authorizationMiddleware, roleCount);

export default roleRouter;
