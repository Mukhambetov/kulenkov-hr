import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Kulenkov HR</h1>
          <p className="text-sm text-muted-foreground">
            Платформа автоматизации найма
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
