import "server-only";

/**
 * Sends the CE enrollment invite email via the Brevo transactional REST API
 * (POST https://api.brevo.com/v3/smtp/email).
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(p: SendInviteParams, inviteUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f3f4f6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
            <tr>
              <td style="background-color:#1e3a8a; padding:24px 32px;">
                <span style="color:#ffffff; font-size:20px; font-weight:bold;">Global Flexinars</span>
                <span style="color:#bfdbfe; font-size:14px; display:block; margin-top:2px;">Continuing Education</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px; color:#111827; font-size:20px;">You're invited to a CE course</h2>
                <p style="margin:0 0 16px; font-size:15px; line-height:1.5;">Hello ${escapeHtml(p.clinicianName)},</p>
                <p style="margin:0 0 16px; font-size:15px; line-height:1.5;">
                  You have been invited to complete the following Continuing-Education course from
                  <strong>Global Flexinars</strong>:
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 0 24px;">
                  <tr>
                    <td style="padding:8px 0; color:#6b7280; font-size:14px; width:110px;">Course</td>
                    <td style="padding:8px 0; font-size:14px;"><strong>${escapeHtml(p.courseTitle)}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; color:#6b7280; font-size:14px;">Topic</td>
                    <td style="padding:8px 0; font-size:14px;">${escapeHtml(p.courseTopic)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; color:#6b7280; font-size:14px;">Speaker</td>
                    <td style="padding:8px 0; font-size:14px;">${escapeHtml(p.speaker)}</td>
                  </tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="background-color:#2563eb; border-radius:8px;">
                      <a href="${inviteUrl}" style="display:inline-block; padding:14px 28px; color:#ffffff; font-size:15px; font-weight:bold; text-decoration:none;">
                        Start the course
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0; color:#6b7280; font-size:13px; line-height:1.5;">
                  Or copy this link into your browser:<br />
                  <a href="${inviteUrl}" style="color:#2563eb; word-break:break-all;">${inviteUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e5e7eb; padding:20px 32px; text-align:center;">
                <p style="margin:0; color:#9ca3af; font-size:12px;">Global Flexinars Inc. | CE That Travels With You</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendInviteEmail(
  params: SendInviteParams
): Promise<SendInviteResult> {
  const inviteUrl = buildInviteUrl(params.inviteToken);
  const subject = `You're invited: ${params.courseTitle} — CE by Global Flexinars`;

  const apiKey = process.env.BREVO_API_KEY;
  if (!isConfigured(apiKey)) {
    console.warn(
      "[send-invite] BREVO_API_KEY not configured — skipping email send. " +
        `Enrollment invite for ${params.to} was created.`
    );
    return { sent: false, skipped: true, reason: "brevo_not_configured", inviteUrl };
  }

  const fromAddress =
    process.env.EMAIL_FROM_ADDRESS || "notifications@mail.flexinars.com";
  const fromName = process.env.EMAIL_FROM_NAME || "Global Flexinars CE";
  const replyTo = process.env.ADMIN_EMAIL || fromAddress;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromAddress, name: fromName },
        to: [{ email: params.to, name: params.clinicianName }],
        replyTo: { email: replyTo },
        subject,
        htmlContent: buildHtml(params, inviteUrl),
      }),
    });

    if (response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        messageId?: string;
      };
      console.info(
        `[send-invite] Brevo transactional email accepted for ${params.to} (messageId=${data.messageId ?? "n/a"}).`
      );
      return { sent: true, messageId: data.messageId, inviteUrl };
    }

    const errText = await response.text().catch(() => "");
    console.warn(
      `[send-invite] Brevo send failed for ${params.to}: HTTP ${response.status} ${errText}`
    );
    return {
      sent: false,
      reason: `brevo_http_${response.status}`,
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
