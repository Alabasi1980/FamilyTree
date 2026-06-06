import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const OTP_EXPIRY_MINUTES = 15;

export async function generateAndStoreOtp(email: string): Promise<string> {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const hash = await bcrypt.hash(otp, 8);
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Upsert: حذف القديم وإنشاء جديد
  await db.verificationToken.deleteMany({ where: { identifier: email } });
  await db.verificationToken.create({ data: { identifier: email, token: hash, expires } });

  return otp;
}

export async function verifyAndConsumeOtp(email: string, code: string): Promise<"ok" | "expired" | "invalid"> {
  const record = await db.verificationToken.findFirst({ where: { identifier: email } });
  if (!record) return "invalid";

  if (record.expires < new Date()) {
    await db.verificationToken.deleteMany({ where: { identifier: email } });
    return "expired";
  }

  const match = await bcrypt.compare(code.trim(), record.token);
  if (!match) return "invalid";

  await db.verificationToken.deleteMany({ where: { identifier: email } });
  return "ok";
}
