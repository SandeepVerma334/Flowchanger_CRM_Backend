import prisma from "../../../prisma/prisma.js";
import checkAdmin from "../../../utils/adminChecks.js";
import { pagination } from "../../../utils/pagination.js";
import { noteSchema } from "../../../utils/validation.js";

const getAllNotes = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const admin = await checkAdmin(req.userId);
        const notes = await pagination(prisma.note, { page, limit, where: { adminId: admin.id } });
        res.status(200).json({ message: "Notes found successfully", ...notes });
    } catch (error) {
        next(error);
    }
};

const getNoteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = await checkAdmin(req.userId);
        const note = await prisma.note.findUnique({ where: { id, adminId: admin.id } });
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }
        res.status(200).json({ message: "Note found successfully", data: note });
    } catch (error) {
        next(error);
    }
}

const createNote = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId);
        const validationData = noteSchema.parse(req.body);
        const note = await prisma.note.create({ data: { ...validationData, adminId: admin.id } });
        res.status(200).json({ message: "Note created successfully", data: note });
    } catch (error) {
        next(error);
    }
};

const updateNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = await checkAdmin(req.userId);
        const note = await prisma.note.findUnique({ where: { id, adminId: admin.id } });
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }
        const validationData = noteSchema.optional().parse(req.body);
        const updatedNote = await prisma.note.update({ where: { id }, data: validationData });
        res.status(200).json({ message: "Note updated successfully", data: updatedNote });
    } catch (error) {
        next(error);
    }
};

const deleteNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = await checkAdmin(req.userId);
        const note = await prisma.note.findUnique({ where: { id, adminId: admin.id } });
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }
        await prisma.note.delete({ where: { id } });
        res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const searchNotes = async (req, res, next) => {
    try {
        const { page, limit, search } = req.query;
        const admin = await checkAdmin(req.userId);

        const where = {
            adminId: admin.id,
            ...(search
                ? {
                    OR: [
                        { title: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } }
                    ],
                }
                : {}),
        };

        const include = {
            // Add related models if needed, e.g., include categories, tags, etc.
        };

        const notes = await pagination(prisma.note, { page, limit, where, include });

        res.status(200).json({ message: "Notes found successfully", ...notes });
    } catch (error) {
        next(error);
    }
};


const bulkDeleteNotes = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const admin = await checkAdmin(req.userId);
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid note IDs" });
        }

        await Promise.all(
            ids.map(async (id) => {
                await prisma.note.delete({
                    where: { id, adminId: admin.id }
                });
            })
        );

        res.status(200).json({ message: "Notes deleted successfully" });
    } catch (error) {
        next(error);
    }
};


export { getAllNotes, getNoteById, createNote, updateNote, deleteNote, searchNotes, bulkDeleteNotes };