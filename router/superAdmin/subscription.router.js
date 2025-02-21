import express from "express";
import { createSubscription, deleteSubscription, getAllSubscription, getSubscriptionById, searchSubscription, updateSubscription } from "../../controller/SuperAdmin/subscription.controller.js";
import errorHandler from "../../middleware/errorhandler.js";

const subscriptionRouter = express.Router();

subscriptionRouter.post("/", createSubscription);
subscriptionRouter.get("/search", searchSubscription);
subscriptionRouter.get("/", getAllSubscription);
subscriptionRouter.get("/:id", getSubscriptionById);
subscriptionRouter.put("/:id", updateSubscription);
subscriptionRouter.delete("/:id", deleteSubscription);

subscriptionRouter.use(errorHandler);

export default subscriptionRouter;
