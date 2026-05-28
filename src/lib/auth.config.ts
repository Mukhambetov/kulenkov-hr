import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

// Edge-safe конфиг (без Prisma, без bcrypt) — используется в proxy/middleware.
// Полный конфиг с Credentials+Prisma живёт в auth.ts (только Node-контекст).
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
