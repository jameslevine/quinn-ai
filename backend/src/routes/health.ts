import { Router, Request, Response } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    version: process.env.npm_package_version || "0.1.0",
    timestamp: new Date().toISOString(),
  });
});
