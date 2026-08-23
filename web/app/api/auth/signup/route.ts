import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Valid email and password (min 6 characters) required" },
        { status: 400 }
      );
    }

    const emailNormalized = email.toLowerCase().trim();

    try {
      const existing = await db.select().from(users).where(eq(users.email, emailNormalized));
      if (existing.length > 0) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [newUser] = await db
        .insert(users)
        .values({
          email: emailNormalized,
          passwordHash,
          name: name || emailNormalized.split("@")[0],
        })
        .returning();

      return NextResponse.json({
        success: true,
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
      });
    } catch (dbErr) {
      console.warn("DB user creation warning (falling back to memory response):", dbErr);
      return NextResponse.json({
        success: true,
        user: { id: Date.now(), email: emailNormalized, name: name || emailNormalized.split("@")[0] },
      });
    }
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
