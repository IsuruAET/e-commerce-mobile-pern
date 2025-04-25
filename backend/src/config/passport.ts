import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";

import { JwtUtils } from "../utils/jwtUtils";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/v1/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email: profile.emails?.[0].value },
          include: { role: true },
        });

        if (!user) {
          // Get the default USER role
          const userRole = await prisma.role.findUnique({
            where: { name: "USER" },
          });

          if (!userRole) {
            throw new AppError(
              ErrorCode.INTERNAL_SERVER_ERROR,
              "Default role not found"
            );
          }

          // Create new user if doesn't exist
          user = await prisma.user.create({
            data: {
              email: profile.emails?.[0].value!,
              name: profile.displayName,
              googleId: profile.id,
              roleId: userRole.id,
            },
            include: { role: true },
          });
        } else if (!user.googleId) {
          // Update existing user with Google ID if not set
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id },
            include: { role: true },
          });
        }

        // Generate tokens
        const tokens = JwtUtils.generateTokens({
          userId: user.id,
          email: user.email || "",
          role: user.role.name,
          isDeactivated: user.isDeactivated || false,
        });

        return done(null, { user, tokens });
      } catch (error) {
        return done(error as Error);
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
