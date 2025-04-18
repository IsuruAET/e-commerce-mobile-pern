import morgan from "morgan";
import { Request } from "express";

// Custom Morgan token for request ID
morgan.token("id", (req: Request) => req.id);

// Custom Morgan formats
const customFormat =
  ":id :method :url :status :response-time ms - :res[content-length] - :user-agent";
const errorFormat =
  ":id :method :url :status :response-time ms - :res[content-length] - :user-agent - :error";

// Development logging configuration
const developmentLogging = () => {
  return [
    // Normal requests
    morgan(customFormat, {
      skip: (req, res) => res.statusCode >= 400,
      stream: process.stdout,
    }),
    // Error requests
    morgan(errorFormat, {
      skip: (req, res) => res.statusCode < 400,
      stream: process.stderr,
    }),
  ];
};

// Production logging configuration
const productionLogging = () => {
  return [
    // Normal requests
    morgan("combined", {
      skip: (req, res) => res.statusCode >= 400,
      stream: process.stdout,
    }),
    // Error requests
    morgan("combined", {
      skip: (req, res) => res.statusCode < 400,
      stream: process.stderr,
    }),
  ];
};

// Export logging middleware based on environment
export const setupLogging = () => {
  if (process.env.NODE_ENV === "development") {
    return developmentLogging();
  }
  return productionLogging();
};
