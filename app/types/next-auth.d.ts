// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  // Session trả về cho client/server
  interface Session {
    user: {
      id: string;
      globalRole?: "SYS_ADMIN" | "SYS_SUPPORT" | "STANDARD";
      status?: "ACTIVE" | "SUSPENDED" | "INVITED" | "DELETED";
    } & DefaultSession["user"];
  }

  // Kiểu User mà adapter trả về khi authorize / tạo user
  interface User extends DefaultUser {
    id: string;
    globalRole?: "SYS_ADMIN" | "SYS_SUPPORT" | "STANDARD";
    status?: "ACTIVE" | "SUSPENDED" | "INVITED" | "DELETED";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    globalRole?: "SYS_ADMIN" | "SYS_SUPPORT" | "STANDARD";
    status?: "ACTIVE" | "SUSPENDED" | "INVITED" | "DELETED";
  }
}

// đảm bảo file này là module để tránh lỗi TS "Augmentations for the global scope..."
export {};
