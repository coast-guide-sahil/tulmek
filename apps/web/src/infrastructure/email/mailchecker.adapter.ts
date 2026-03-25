import MailChecker from "mailchecker";
import type { EmailValidatorPort } from "@tulmek/core/ports";

export class MailcheckerAdapter implements EmailValidatorPort {
  isDisposable(email: string): boolean {
    return !MailChecker.isValid(email);
  }
}
