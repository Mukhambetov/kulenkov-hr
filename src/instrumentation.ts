export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  try {
    const { prisma } = await import("@/lib/prisma");
    const bcrypt = (await import("bcryptjs")).default;

    const existing = await prisma.user.findUnique({
      where: { email: "admin@kulenkov.kz" },
    });
    if (!existing) {
      const password = await bcrypt.hash("admin123", 10);
      await prisma.user.create({
        data: {
          email: "admin@kulenkov.kz",
          name: "Администратор",
          password,
          role: "ADMIN",
        },
      });
      console.log("[seed] Создан администратор admin@kulenkov.kz");
    }
  } catch (e) {
    console.error("[seed] Ошибка сида (БД может быть ещё не готова):", e);
  }
}
