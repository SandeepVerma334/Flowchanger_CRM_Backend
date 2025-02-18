import { subscriptionSchema } from "../../utils/validation.js";
import prisma from "../../prisma/prisma.js";
const getAllSubscription = async (req, res, next) => {
    try {
        // Get page and limit from query parameters, with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Calculate the offset for pagination
        const skip = (page - 1) * limit;

        // Fetch the subscriptions with pagination
        const subscriptions = await prisma.subscription.findMany({
            skip: skip,
            take: limit
        });

        // Get the total count of subscriptions (optional, for total pages)
        const totalSubscriptions = await prisma.subscription.count();

        // Send the paginated response
        res.status(200).json({
            subscriptions,
            totalSubscriptions,
            totalPages: Math.ceil(totalSubscriptions / limit),
            currentPage: page
        });
    } catch (error) {
        next(error);
    }
};

const getSubscriptionById = async (req, res, next) => {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { id: req.params.id }
        });

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found" });
        }

        res.status(200).json(subscription);
    } catch (error) {
        next(error);
    }
}

const createSubscription = async (req, res, next) => {
    try {
        const validatedData = subscriptionSchema.parse(req.body);
        const subscription = await prisma.subscription.create({
            data: validatedData
        });

        res.status(201).json(subscription);
    } catch (error) {
        next(error);
    }
}

const updateSubscription = async (req, res, next) => {
    try {
        const findSubscription = await prisma.subscription.findUnique({
            where: { id: req.params.id }
        })
        if (!findSubscription) {
            return res.status(404).json({ message: "Subscription not found" });
        }

        const validatedData = subscriptionSchema.partial().parse(req.body);
        const subscription = await prisma.subscription.update({
            where: { id: req.params.id },
            data: validatedData
        });

        res.status(200).json({ message: "Subscription updated successfully", data: subscription });
    } catch (error) {
        next(error);
    }
}

const deleteSubscription = async (req, res, next) => {
    try {
        const findSubscription = await prisma.subscription.findUnique({
            where: { id: req.params.id }
        })
        if (!findSubscription) {
            return res.status(404).json({ message: "Subscription not found" });
        }
        const subscription = await prisma.subscription.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: "Subscription deleted successfully", data: subscription });

    } catch (error) {
        next(error);
    }
}

const searchSubscription = async (req, res, next) => {
    try {
        const subscriptions = await prisma.subscription.findMany({
            where: {
                name: {
                    contains: req.query.name,
                    mode: "insensitive"
                }
            }
        });

        res.status(200).json(subscriptions);
    } catch (error) {
        next(error);
    }
}

export { getAllSubscription, getSubscriptionById, createSubscription, updateSubscription, deleteSubscription, searchSubscription };