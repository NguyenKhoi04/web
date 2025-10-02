import NextAuth, { DefaultSession } from "next-auth";

// Mở rộng Session trên client/server
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      globalRole?: "SYS_ADMIN" | "SYS_SUPPORT" | "STANDARD";
      status?: "ACTIVE" | "SUSPENDED" | "INVITED" | "DELETED";
    } & DefaultSession["user"];
  }
}

// Mở rộng JWT token
declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    globalRole?: "SYS_ADMIN" | "SYS_SUPPORT" | "STANDARD";
    status?: "ACTIVE" | "SUSPENDED" | "INVITED" | "DELETED";
  }
}
