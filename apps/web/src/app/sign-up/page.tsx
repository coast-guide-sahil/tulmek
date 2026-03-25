import { connection } from "next/server";
import { SignUpForm } from "./signup-form";

export default async function SignUpPage() {
  await connection();

  const requireEmailVerification =
    process.env.REQUIRE_EMAIL_VERIFICATION === "true";

  return (
    <SignUpForm requireEmailVerification={requireEmailVerification} />
  );
}
