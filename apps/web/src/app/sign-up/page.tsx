import { SignUpForm } from "./signup-form";

const requireEmailVerification =
  process.env.REQUIRE_EMAIL_VERIFICATION === "true";

export default function SignUpPage() {
  return (
    <SignUpForm requireEmailVerification={requireEmailVerification} />
  );
}
