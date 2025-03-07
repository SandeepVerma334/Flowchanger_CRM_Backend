import { Router } from "express";
import { authorizationMiddleware } from "../../middleware/auth.js";
import { createClient, getClientById, getClients, searchClientByName, updateClient } from "../../controller/admin/client/client.controller.js";
import errorHandler from "../../middleware/errorhandler.js";
const clientRouter = Router();

clientRouter.post("/", authorizationMiddleware, createClient);
clientRouter.get("/", authorizationMiddleware, getClients);
clientRouter.get("/search", authorizationMiddleware, searchClientByName);
clientRouter.put("/:id", authorizationMiddleware, updateClient);
clientRouter.get("/:id", authorizationMiddleware, getClientById);


clientRouter.use(errorHandler);

export default clientRouter;