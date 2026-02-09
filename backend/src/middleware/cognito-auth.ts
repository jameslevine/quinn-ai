import { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        [key: string]: unknown;
      };
    }
  }
}

// Create verifier (lazy initialization)
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

const getVerifier = () => {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID!,
      tokenUse: "access",
      clientId: process.env.COGNITO_CLIENT_ID!,
    });
  }
  return verifier;
};

export const cognitoAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No token provided",
        },
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid token format",
        },
      });
      return;
    }

    try {
      const payload = await getVerifier().verify(token);
      req.user = {
        sub: payload.sub,
        email: (payload.email as string) || "",
      };
      next();
    } catch (err) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid token",
        },
      });
      return;
    }
  } catch (err) {
    next(err);
  }
};
