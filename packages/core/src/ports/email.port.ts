export interface EmailPort {
  sendWelcome(to: string, name: string): Promise<void>;
  sendPasswordReset(to: string, resetUrl: string): Promise<void>;
}
