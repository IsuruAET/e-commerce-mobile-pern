export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type UserProfile = AuthUser & {
  phone: string | null;
};

export type PasswordResetResponse = {
  message: string;
};

export type PasswordChangeResponse = {
  message: string;
};

export type ProfileUpdateResponse = {
  user: UserProfile;
};

// Google Auth Types
export type GoogleUser = {
  id: string;
  email: string;
  name: string;
  isDeactivated: boolean;
};

export type GoogleTokens = {
  accessToken: string;
  refreshToken: string;
};
