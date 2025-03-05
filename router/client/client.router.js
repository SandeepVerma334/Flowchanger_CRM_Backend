import { Router } from "express";
import { authorizationMiddleware } from "../../middleware/auth.js";
import { createClient, getClients, updateClient } from "../../controller/admin/client/client.controller.js";
import errorHandler from "../../middleware/errorhandler.js";
const clientRouter = Router();

clientRouter.post("/", authorizationMiddleware, createClient);
clientRouter.get("/", authorizationMiddleware, getClients);
clientRouter.put("/:id", authorizationMiddleware, updateClient);

clientRouter.use(errorHandler);

export default clientRouter;