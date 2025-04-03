import { transactionSchema } from "../../utils/validation.js";
import prisma from "../../prisma/prisma.js";
import { pagination } from "../../utils/pagination.js";

/**
 * ✅ Create a Transaction
 */
const createTransaction = async (req, res, next) => {
  try {
    const validationData = transactionSchema.parse(req.body);
    console.log(validationData);
    const hasTransaction = await prisma.transaction.findUnique({
      where: { paymentId: validationData.paymentId },
    });

    if (hasTransaction) {
      return res.status(400).json({
        message: `Transaction already exists with this paymentId: ${validationData.paymentId}`
      });
    }

    const transaction = await prisma.transaction.create({ data: validationData });

    return res.status(201).json({
      message: "Transaction created successfully",
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ✅ Get All Transactions (With Pagination)
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const result = await pagination(prisma.transaction, { page, limit });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * ✅ Get Transactions by Admin ID (With Pagination)
 */
const getTransactionByAdminId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await pagination(prisma.transaction, { page, limit, where: { adminId: id } });

    return res.status(200).json({
      message: "Transactions found successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ✅ Search Transactions by Package Name or Amount
 */
const searchTransaction = async (req, res, next) => {
  try {
    const { packageName, amount, page, limit } = req.query;

    const where = {};

    if (packageName) {
      where.subscription = { package: { packageName: { contains: packageName, mode: "insensitive" } } };
    }

    if (amount) {
      where.amount = Number(amount); // Ensure correct data type
    }

    const result = await pagination(prisma.transaction, { page, limit, where });

    if (result.data.length === 0) {
      return res.status(404).json({ message: "No transactions found.", data: [] });
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export { createTransaction, getAllTransactions, getTransactionByAdminId, searchTransaction };