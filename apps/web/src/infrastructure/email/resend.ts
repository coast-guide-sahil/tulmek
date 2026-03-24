import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const emailFrom =
  process.env.EMAIL_FROM ?? "Interview Prep <onboarding@resend.dev>";

export async function sendOTPEmail(to: string, otp: string) {
  if (!resend) {
    console.log(`[DEV] Email OTP for ${to}: ${otp}`);
    return;
  }

  await resend.emails.send({
    from: emailFrom,
    to,
    subject: `${otp} is your verification code`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #666; margin-bottom: 24px;">
          Enter this code to complete your sign-up:
        </p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px;
                    text-align: center; padding: 16px; background: #f4f4f5;
                    border-radius: 8px; margin-bottom: 24px;">
          ${otp}
        </div>
        <p style="color: #999; font-size: 14px;">
          This code expires in 5 minutes. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
}
