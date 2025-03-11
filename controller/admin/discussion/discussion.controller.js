import prisma from "../../../prisma/prisma.js";
import checkAdmin from "../../../utils/adminChecks.js";
import { pagination } from "../../../utils/pagination.js";
import { discussionSchema } from "../../../utils/validation.js";

const getAllDiscussions = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const admin = await checkAdmin(req.userId);
        const allDiscussions = await pagination(prisma.discussion, { page, limit, where: { adminId: admin.id } });
        res.status(200).json({ message: "All discussions fetched successfully", ...allDiscussions });
    } catch (error) {
        next(error);
    }
};

const getDiscussionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = await checkAdmin(req.userId);
        const discussion = await prisma.discussion.findUnique({ where: { id, adminId: admin.id } });
        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }
        res.status(200).json({ message: "Discussion found successfully", data: discussion });
    } catch (error) {
        next(error);
    }
}

const createDiscussion = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId);
        const validationData = discussionSchema.parse(req.body);
        const newDiscussion = await prisma.discussion.create({ data: { ...validationData, adminId: admin.id } });
        res.status(200).json({ message: "Discussion created successfully", data: newDiscussion });
    } catch (error) {
        next(error);
    }
};

const updateDiscussion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = await checkAdmin(req.userId);
        const note = await prisma.discussion.findUnique({ where: { id, adminId: admin.id } });
        if (!note) {
            return res.status(404).json({ message: "Discussion not found" });
        }
        const validationData = discussionSchema.optional().parse(req.body);
        const updateDiscussion = await prisma.discussion.update({ where: { id }, data: validationData });
        res.status(200).json({ message: "Discussion updated successfully", data: updateDiscussion });
    } catch (error) {
        next(error);
    }
};

const deleteDiscussion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = await checkAdmin(req.userId);
        const findDiscussion = await prisma.discussion.findUnique({ where: { id, adminId: admin.id } });
        if (!findDiscussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }
        await prisma.discussion.delete({ where: { id } });
        res.status(200).json({ message: "Discussion deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const searchDiscussions = async (req, res, next) => {
    try {
        const { page, limit, search } = req.query;
        const admin = await checkAdmin(req.userId);

        const where = {
            adminId: admin.id,
            OR: search
                ? [
                    { subject: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } }
                ]
                : undefined
        };

        const include = {
            // Add related models if needed, e.g., include categories, tags, etc.
        };

        const searchDiscussions = await pagination(prisma.discussion, { page, limit, where, include });

        res.status(200).json({ message: "Discussions found successfully", ...searchDiscussions });
    } catch (error) {
        next(error);
    }
};


const bulkDeleteDiscussions = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const admin = await checkAdmin(req.userId);
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid note IDs" });
        }

        await Promise.all(
            ids.map(async (id) => {
                await prisma.discussion.delete({
                    where: { id, adminId: admin.id }
                });
            })
        );

        res.status(200).json({ message: "Discussions deleted successfully" });
    } catch (error) {
        next(error);
    }
};


export { getAllDiscussions, getDiscussionById, createDiscussion, updateDiscussion, deleteDiscussion, searchDiscussions, bulkDeleteDiscussions };