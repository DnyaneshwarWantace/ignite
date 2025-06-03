import GoogleBtn from "@/components/auth/google-signin";
import LoginForm from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-background p-4 sm:p-8 ">
      <Card className="w-full max-w-[350px] sm:max-w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center ">
            Login
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account using Google
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">OR</p>
          <GoogleBtn />
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-muted-foreground text-center">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-primary">
              Privacy Policy
            </a>
            .
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
