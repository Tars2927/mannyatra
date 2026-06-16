/**
 * Resend email sending — isolated to the email-campaigns feature.
 * Reads RESEND_API_KEY directly from process.env, not from the main env.ts.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

/** Send a single email via Resend API. */
export async function sendEmail(opts: SendEmailOptions): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY ?? "";

  if (!apiKey) {
    console.warn("[Resend] No RESEND_API_KEY configured — email not sent");
    return { success: false, error: "No RESEND_API_KEY configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: opts.from ?? "Mannyatra <stories@mannyatra.in>",
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo ?? "hello@mannyatra.in",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Resend ${res.status}: ${err}` };
    }

    const data = (await res.json()) as { id: string };
    return { success: true, id: data.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Send emails in batches with delay and retry. */
export async function sendBatch(
  emails: string[],
  subject: string,
  html: string,
  onProgress: (sent: number, failed: number, total: number) => void
): Promise<{ sent: number; failed: number; errors: Array<{ email: string; error: string }> }> {
  const BATCH_SIZE = 50;
  const BATCH_DELAY_MS = 2000;
  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    let result = await sendEmail({ to: email, subject, html });

    // Retry once on failure
    if (!result.success) {
      await sleep(500);
      result = await sendEmail({ to: email, subject, html });
    }

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push({ email, error: result.error ?? "Unknown error" });
    }

    onProgress(sent, failed, emails.length);

    // Batch delay every BATCH_SIZE emails
    if ((i + 1) % BATCH_SIZE === 0 && i + 1 < emails.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return { sent, failed, errors };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
