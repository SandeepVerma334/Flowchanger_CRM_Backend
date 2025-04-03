import express from "express";

import errorHandler from "../../middleware/errorhandler.js";
import { bulkDeleteNotes, createNote, deleteNote, getAllNotes, getNoteById, searchNotes, updateNote } from "../../controller/admin/notes/note.controller.js";
import { authorizationMiddleware } from "../../middleware/auth.js";

const noteRouter = express.Router();

noteRouter.post("/", authorizationMiddleware, createNote);
noteRouter.get("/", authorizationMiddleware, getAllNotes);
noteRouter.get("/search", authorizationMiddleware, searchNotes);
noteRouter.delete("/bulk-delete", authorizationMiddleware, bulkDeleteNotes);
noteRouter.delete("/:id", authorizationMiddleware, deleteNote);
noteRouter.get("/:id", authorizationMiddleware, getNoteById);
noteRouter.put("/:id", authorizationMiddleware, updateNote);


noteRouter.use(errorHandler);

export default noteRouter;