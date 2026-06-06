import { Resend } from "resend";

export async function sendOtpEmail(to: string, otp: string): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email send");
    return { success: false, error: "خدمة البريد غير مفعّلة" };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: "شجرة العائلات <noreply@families-tree.app>",
      to,
      subject: `رمز التحقق: ${otp}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0f1117; color: #e5e7eb; border-radius: 12px;">
          <h2 style="color: #d4a854; margin-bottom: 8px;">تأكيد البريد الإلكتروني</h2>
          <p style="color: #9ca3af; margin-bottom: 24px;">رمز التحقق الخاص بك:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #f5f5f5; background: #1a1d27; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
            ${otp}
          </div>
          <p style="color: #9ca3af; font-size: 13px;">صالح لمدة 15 دقيقة. لا تشارك هذا الرمز مع أحد.</p>
        </div>
      `,
    });
    return { success: true };
  } catch {
    return { success: false, error: "فشل إرسال البريد" };
  }
}
