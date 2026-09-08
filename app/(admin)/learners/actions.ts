"use server";

import { revalidatePath } from "next/cache";
import { query } from "../../../lib/db";
import { sendInviteEmail } from "../../../lib/email/send-invite";

export interface InviteFormState {
  ok: boolean;
  message: string;
  emailSent?: boolean;
  emailSkipped?: boolean;
  inviteUrl?: string;
}

/**
 * Server action: create an enrollment (invite) and fire the Brevo invite email.
 * The enrollment is always persisted; email failures degrade gracefully.
 */
export async function createInvite(
  _prev: InviteFormState | null,
  formData: FormData
): Promise<InviteFormState> {
  const clinicianName = String(formData.get("clinician_name") || "").trim();
  const professionalTitle = String(formData.get("professional_title") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const location = String(formData.get("location") || "").trim() || null;
  const courseId = String(formData.get("course_id") || "").trim();

  if (!clinicianName || !professionalTitle || !email || !courseId) {
    return {
      ok: false,
      message: "Please fill in clinician name, title, email and course.",
    };
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  // Resolve course (for tenant_id + email content)
  const courses = await query<{
    id: string;
    tenant_id: string;
    title: string;
    speaker: string;
    topic: string;
  }>(
    "SELECT id, tenant_id, title, speaker, topic FROM courses WHERE id = $1 LIMIT 1",
    [courseId]
  );
  const course = courses[0];
  if (!course) {
    return { ok: false, message: "Selected course was not found." };
  }

  // Insert enrollment (unique on course_id, email)
  let enrollment: { id: string; invite_token: string } | undefined;
  try {
    const rows = await query<{ id: string; invite_token: string }>(
      `INSERT INTO enrollments
         (tenant_id, course_id, clinician_name, professional_title, email, location, status, invited_at, invite_expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,'invited', now(), now() + interval '30 days')
       RETURNING id, invite_token`,
      [
        course.tenant_id,
        course.id,
        clinicianName,
        professionalTitle,
        email,
        location,
      ]
    );
    enrollment = rows[0];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("duplicate key") || msg.includes("unique")) {
      return {
        ok: false,
        message: `${email} is already enrolled in this course.`,
      };
    }
    return { ok: false, message: `Could not create enrollment: ${msg}` };
  }

  // Fire invite email (graceful fallback if Brevo not configured)
  const emailResult = await sendInviteEmail({
    to: email,
    clinicianName,
    courseTitle: course.title,
    courseTopic: course.topic,
    speaker: course.speaker,
    inviteToken: enrollment!.invite_token,
  });

  revalidatePath("/learners");
  revalidatePath("/");

  if (emailResult.sent) {
    return {
      ok: true,
      message: `Invite created and email sent to ${email}.`,
      emailSent: true,
      inviteUrl: emailResult.inviteUrl,
    };
  }
  if (emailResult.skipped) {
    return {
      ok: true,
      message: `Invite created for ${email}. Email skipped — BREVO_API_KEY is not configured yet.`,
      emailSent: false,
      emailSkipped: true,
      inviteUrl: emailResult.inviteUrl,
    };
  }
  return {
    ok: true,
    message: `Invite created for ${email}, but the email could not be sent (${emailResult.reason}).`,
    emailSent: false,
    inviteUrl: emailResult.inviteUrl,
  };
}
