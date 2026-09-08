import "server-only";

/**
 * Sends the CE enrollment invite email via the Brevo provider in
 * @tindevelopers/base-core.
 *
 * Graceful degradation: if BREVO_API_KEY is not set (still a placeholder), the
 * function logs a warning and returns { sent: false, skipped: true } WITHOUT
 * throwing — the caller has already persisted the enrollment record, so the
 * invite link can be re-sent later once the key is configured.
 */

export interface SendInviteParams {
  to: string;
  clinicianName: string;
  courseTitle: string;
  courseTopic: string;
  speaker: string;
  inviteToken: string;
}

export interface SendInviteResult {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  messageId?: string;
  inviteUrl: string;
}

const PLACEHOLDER_MARKERS = ["PASTE_", "PLACEHOLDER", "CHANGE_ME", "your-", "xxxx"];

function isConfigured(value: string | undefined): value is string {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  return !PLACEHOLDER_MARKERS.some((m) =>
    v.toLowerCase().includes(m.toLowerCase())
  );
}

function buildInviteUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}/course/${token}`;
}

function buildHtml(p: SendInviteParams, inviteUrl: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="color:#111827;">You're invited to a Continuing-Education course</h2>
    <p>Hello ${escapeHtml(p.clinicianName)},</p>
    <p>You have been invited to complete the following CE course from
       <strong>Global Flexinars</strong>:</p>
    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      <tr><td style="padding:6px 0; color:#6b7280;">Course</td>
          <td style="padding:6px 0;"><strong>${escapeHtml(p.courseTitle)}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Topic</td>
          <td style="padding:6px 0;">${escapeHtml(p.courseTopic)}</td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Speaker</td>
          <td style="padding:6px 0;">${escapeHtml(p.speaker)}</td></tr>
    </table>
    <p style="margin:24px 0;">
      <a href="${inviteUrl}"
         style="background:#2563eb; color:#ffffff; padding:12px 20px; border-radius:8px;
                text-decoration:none; display:inline-block;">
        Start the course
      </a>
    </p>
    <p style="color:#6b7280; font-size:13px;">
      Or copy this link into your browser:<br />
      <a href="${inviteUrl}">${inviteUrl}</a>
    </p>
    <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />
    <p style="color:#9ca3af; font-size:12px;">Global Flexinars Inc. — CE Platform</p>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendInviteEmail(
  params: SendInviteParams
): Promise<SendInviteResult> {
  const inviteUrl = buildInviteUrl(params.inviteToken);
  const subject = `You're invited to complete CE: ${params.courseTitle}`;

  if (!isConfigured(process.env.BREVO_API_KEY)) {
    console.warn(
      "[send-invite] BREVO_API_KEY not configured — skipping email send. " +
        `Enrollment invite for ${params.to} was created; invite link: ${inviteUrl}`
    );
    return { sent: false, skipped: true, reason: "brevo_not_configured", inviteUrl };
  }

  const fromAddress =
    process.env.EMAIL_FROM_ADDRESS || "noreply@globalflexinars.com";
  const fromName = process.env.EMAIL_FROM_NAME || "Global Flexinars CE";
  const replyTo = process.env.ADMIN_EMAIL || fromAddress;

  try {
    // Ensure the base-core provider picks Brevo.
    process.env.EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "brevo";
    const { sendEmail } = await import("@tindevelopers/base-core/email");
    const result = await sendEmail({
      to: params.to,
      from: { email: fromAddress, name: fromName },
      replyTo,
      subject,
      html: buildHtml(params, inviteUrl),
    });
    if (result.success) {
      return { sent: true, messageId: result.messageId, inviteUrl };
    }
    console.warn(
      `[send-invite] Brevo send failed for ${params.to}: ${result.error?.message}`
    );
    return {
      sent: false,
      reason: result.error?.message || "send_failed",
      inviteUrl,
    };
  } catch (err) {
    console.warn(
      `[send-invite] Email send threw for ${params.to}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "send_error",
      inviteUrl,
    };
  }
}
