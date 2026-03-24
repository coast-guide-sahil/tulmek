import MailChecker from "mailchecker";
import type { EmailValidatorPort } from "@interview-prep/core/ports";

export class MailcheckerAdapter implements EmailValidatorPort {
  isDisposable(email: string): boolean {
    return !MailChecker.isValid(email);
  }
}
