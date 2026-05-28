import type { Role } from "@/generated/prisma/enums";
import "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }
}
