import { Prisma } from "@prisma/client";
import ApiError from "../utils/ApiError";

/**
 * Global error handler middleware.
 * Provides user-friendly error messages.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong. Please try again.";

  // 🛑 Handle Custom API Errors First
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // 🛑 Handle Prisma Errors for user-friendly messages
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        statusCode = 400;
        message = `The ${err.meta?.target?.join(", ")} you entered is already in use. Please use a different one.`;
        break;
      case "P2003":
        statusCode = 400;
        message = `Invalid reference: The provided ${err.meta?.field_name || "value"} does not exist.`;
        break;
      case "P2025":
        statusCode = 404;
        message = "The requested record was not found.";
        break;
      default:
        statusCode = 500;
        message = "A database error occurred. Please try again later.";
    }
  }

  // 🛑 Handle Zod Validation Errors
  if (err.name === "ZodError") {
    statusCode = 400;
    message = err.errors.map((e) => ({
      field: e.path?.join(".") || "unknown",
      message: e.message,
    }));
  }

  // 📌 Log the error in production (Optional: Use winston/pino)
  if (process.env.NODE_ENV === "production") {
    console.error(err);
  }

  // 📌 Return the user-friendly error message
  res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(message) ? message : undefined, // Include detailed errors for validation failures
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // Show stack only in development mode
  });
};

export default errorHandler;
