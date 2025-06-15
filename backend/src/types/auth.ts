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

export type PasswordResetResponse = {
  message: string;
};

export type PasswordChangeResponse = {
  message: string;
};

export type ProfileUpdateResponse = {
  message: string;
  user: AuthUser & {
    phone: string | null;
  };
};
