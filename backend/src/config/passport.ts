import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import { Request, Response, NextFunction } from "express";

// Middleware to validate Google OAuth flow
export const validateGoogleCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.query.code) {
    return res.redirect("/api/v1/auth/google");
  }
  next();
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:5000/api/v1/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        if (!profile.emails?.[0]?.value) {
          return done(
            new AppError(
              ErrorCode.INVALID_USER_DATA,
              "No email provided by Google"
            )
          );
        }

        // Just pass the profile data to service layer
        return done(null, {
          user: {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            isDeactivated: false, // Default value, service layer will check actual status
          },
          tokens: {
            accessToken: _accessToken,
            refreshToken: _refreshToken,
          },
        });
      } catch (error) {
        return done(
          new AppError(
            ErrorCode.AUTHENTICATION_FAILED,
            error instanceof Error
              ? error.message
              : "Google authentication failed"
          )
        );
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});
