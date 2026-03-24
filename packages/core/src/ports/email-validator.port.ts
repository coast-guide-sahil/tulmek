export interface EmailValidatorPort {
  isDisposable(email: string): boolean;
}
