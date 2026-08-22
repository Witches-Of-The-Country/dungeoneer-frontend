import { RegisterForm } from "@/components/register-form";

export const metadata = {
  title: "Cadastrar Aventureiro | Dungeoneer",
  description: "Crie sua conta para desbravar os mistérios da escuridão.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements consistent with dark fantasy theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-lg z-10 relative">
        <RegisterForm />
      </div>
    </div>
  );
}
