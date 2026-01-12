"use client";
import { signIn } from "next-auth/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";

export default function LoginForm() {
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Email"
        value={email}
        onChange={(e) => {
          setemail(e.target.value);
        }}
      />
      <Input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => {
          setpassword(e.target.value);
        }}
      />

      <Button
        onClick={() => {
          if (email && password && email !== "" && password !== "") {
            signIn("credentials", {
              email,
              password,
              callbackUrl: "/x-ray",
            });
          }
        }}
        variant="outline"
        className="w-full"
      >
        Sign in
      </Button>
    </div>
  );
}
