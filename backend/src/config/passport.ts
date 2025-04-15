import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import { AuthService } from "../api/v1/services/authService";

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email: profile.emails?.[0].value },
        });

        if (!user) {
          // Create new user if doesn't exist
          user = await prisma.user.create({
            data: {
              email: profile.emails?.[0].value!,
              name: profile.displayName,
              googleId: profile.id,
            },
          });
        } else if (!user.googleId) {
          // Update existing user with Google ID if not set
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id },
          });
        }

        // Generate tokens
        const tokens = AuthService.generateTokens({
          userId: user.id,
          email: user.email || "",
          role: user.role || "USER",
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
