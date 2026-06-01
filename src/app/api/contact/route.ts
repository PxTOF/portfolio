import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters."),
  email: z.string().trim().email("Add a valid email address."),
  company: z.string().trim().min(2, "Brand / company is required."),
  phone: z.string().trim().optional(),
  projectType: z.string().trim().min(1, "Choose a project type."),
  budget: z.string().trim().min(1, "Choose a budget range."),
  message: z.string().trim().min(20, "Tell us a little more about what needs to move."),
  contactMode: z.enum(["Email", "Phone", "Instagram"]),
});

type Inquiry = z.infer<typeof inquirySchema>;

function textEmail(data: Inquiry) {
  return [
    "New SNAG project inquiry",
    "",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone || "Not shared"}`,
    `Brand / company: ${data.company}`,
    `Project type: ${data.projectType}`,
    `Budget: ${data.budget}`,
    `Preferred contact: ${data.contactMode}`,
    "",
    "Message:",
    data.message,
  ].join("\n");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Send the form as JSON." }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message || "Check the form and try again.",
        issues: z.treeifyError(parsed.error),
      },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "teamstudiosnag@gmail.com";

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Contact email is not configured yet. Add RESEND_API_KEY on Vercel.",
      },
      { status: 503 }
    );
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "SNAG Website <onboarding@resend.dev>",
      to: toEmail,
      replyTo: parsed.data.email,
      subject: `New SNAG inquiry: ${parsed.data.company}`,
      text: textEmail(parsed.data),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SNAG contact send failed", error);
    return NextResponse.json(
      { ok: false, error: "Could not send right now. Please email teamstudiosnag@gmail.com." },
      { status: 502 }
    );
  }
}
