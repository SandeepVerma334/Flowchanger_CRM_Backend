import { Router } from "express";
const roleRouter = Router();
import { authorizationMiddleware } from "../../middleware/auth.js";
import { addRole, fetchRole, fetchRoleWithId, updateRole, deleteRole, searchRoleByName, deleteRoleInBulk, countRoles } from "../../controller/admin/role.controller.js";

roleRouter.post("/", authorizationMiddleware, addRole);
roleRouter.get("/", authorizationMiddleware, fetchRole);
roleRouter.get("/search", authorizationMiddleware, searchRoleByName);
roleRouter.delete("/bulk-delete", authorizationMiddleware, deleteRoleInBulk);
roleRouter.get("/count", authorizationMiddleware, countRoles);
roleRouter.put("/:id", authorizationMiddleware, updateRole);
roleRouter.get("/:id", authorizationMiddleware, fetchRoleWithId);
roleRouter.delete("/:id", authorizationMiddleware, deleteRole);

export default roleRouter;
