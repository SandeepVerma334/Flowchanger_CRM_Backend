import { Router } from "express";
import { authorizationMiddleware } from "../../middleware/auth.js";
import { bulkDeleteClient, createClient, deleteClient, getClientById, getClients, searchClientByName, updateClient } from "../../controller/admin/client/client.controller.js";
import errorHandler from "../../middleware/errorhandler.js";
const clientRouter = Router();

clientRouter.post("/", authorizationMiddleware, createClient);
clientRouter.get("/", authorizationMiddleware, getClients);
clientRouter.get("/search", authorizationMiddleware, searchClientByName);
clientRouter.delete("/delete/:id", authorizationMiddleware, deleteClient);
clientRouter.delete("/bulk-delete", authorizationMiddleware, bulkDeleteClient);
clientRouter.put("/:id", authorizationMiddleware, updateClient);
clientRouter.get("/:id", authorizationMiddleware, getClientById);

clientRouter.use(errorHandler);

export default clientRouter;