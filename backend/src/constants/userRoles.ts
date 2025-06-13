export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  STYLIST = "stylist",
}

export const DEFAULT_USER_ROLE = UserRole.USER;

export const isAdmin = (role: string) => role === UserRole.ADMIN;
export const isStylist = (role: string) => role === UserRole.STYLIST;
export const isUser = (role: string) => role === UserRole.USER;
