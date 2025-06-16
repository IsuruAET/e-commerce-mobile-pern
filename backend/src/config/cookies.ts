export const COOKIE_CONFIG = {
  REFRESH_TOKEN: {
    name: "refreshToken",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  },
  CSRF: {
    name: "csrf_token",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
  CSRF_JS: {
    name: "csrf_token_js",
    options: {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
} as const;

// CSRF Security Configuration
export const CSRF_SECURITY = {
  // Header name
  HEADER_NAME: "X-CSRF-Token",
  // Methods that don't require CSRF protection
  SAFE_METHODS: ["GET", "HEAD", "OPTIONS"] as const,
} as const;
