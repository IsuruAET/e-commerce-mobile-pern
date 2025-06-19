import pino from "pino";
import { NextFunction, Request, Response } from "express";
import { DateTime } from "luxon";

// Create base logger
const baseLogger = pino({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      levelFirst: true,
      ignore: "pid,hostname",
      messageFormat: "{msg}",
      translateTime: "SYS:standard",
    },
  },
  base: null,
  timestamp: () =>
    `,"time":"${DateTime.now().toFormat("yyyy-MM-dd HH:mm:ss.SSS")}"`,
});

// Create request logger middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      id: req.id,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("content-length"),
      userAgent: req.get("user-agent"),
    };

    if (res.statusCode >= 400) {
      baseLogger.error(logData);
    } else {
      baseLogger.info(logData);
    }
  });

  next();
};

// Export logger instance for direct use
export const logger = baseLogger;
