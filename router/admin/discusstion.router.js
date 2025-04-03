import express from "express";

import errorHandler from "../../middleware/errorhandler.js";
import { authorizationMiddleware } from "../../middleware/auth.js";
import { bulkDeleteDiscussions, createDiscussion, deleteDiscussion, getAllDiscussions, getDiscussionById, searchDiscussions, updateDiscussion } from "../../controller/admin/discussion/discussion.controller.js";

const discussionRouter = express.Router();

discussionRouter.post("/", authorizationMiddleware, createDiscussion);
discussionRouter.get("/", authorizationMiddleware, getAllDiscussions);
discussionRouter.get("/search", authorizationMiddleware, searchDiscussions);
discussionRouter.delete("/bulk-delete", authorizationMiddleware, bulkDeleteDiscussions);
discussionRouter.delete("/:id", authorizationMiddleware, deleteDiscussion);
discussionRouter.get("/:id", authorizationMiddleware, getDiscussionById);
discussionRouter.put("/:id", authorizationMiddleware, updateDiscussion);


discussionRouter.use(errorHandler);

export default discussionRouter;