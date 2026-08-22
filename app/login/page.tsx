import { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Login | Dungeoneer",
  description: "Entre em sua conta para acessar suas campanhas e fichas de personagens.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-background relative overflow-hidden">
      {/* Decorative background elements for dark fantasy vibe */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-sidebar-ring/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full z-10">
        <LoginForm />
      </div>
    </main>
  );
}
