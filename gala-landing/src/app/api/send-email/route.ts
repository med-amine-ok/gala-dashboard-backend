// import { EmailTemplate } from "@/components/email-template";
import { NextResponse } from "next/server";

import nodemailer from "nodemailer";
import { mailService } from "@/lib/mail";

// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function POST() {
//   try {
//     const { data, error } = await resend.emails.send({
//       from: "Acme <onboarding@resend.dev>",
//       to: ["abdoallahusma5704@gmail.com"],
//       subject: "Emails Testing",
//       react: EmailTemplate({ firstName: "Abdallah" }),
//     });

//     if (error) {
//       return Response.json({ error }, { status: 500 });
//     }

//     // Looking to send emails in production? Check out our Email API/SMTP product!
//     return Response.json(data);
//   } catch (error) {
//     return Response.json({ error }, { status: 500 });
//   }
// }

// app/api/contact/route.js

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const mailOptions = {
      from:
        data.from || `"Engineers Gala Dev Team" <dev-team@gala.vic-enp.com>`,
      to: data.to || ["abdallah.mohellebi@gmail.com"],
      subject: data.subject || "No subject",
      text: data.text || "",
      html: data.html || undefined,
      attachments: data.attachments || undefined,
      headers: {
        "List-Unsubscribe":
          "<mailto:unsubscribe@yourdomain.com>, <https://yourdomain.com/unsubscribe?email={{email}}>",
      },
    };

    await mailService.sendMail(mailOptions);

    return NextResponse.json({ ok: true, status: "Email sent successfully" });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// [
//   "abdallah.mohellebi@g.enp.edu.dz",
//   "yanir_iskandar.louni@g.enp.edu.dz",
//   "houda_maria.lagraa@g.enp.edu.dz",
//   "hadjer.mokeddem@g.enp.edu.dz",
//   "mohamed_amine.ould_khaoua@g.enp.edu.dz",
//   "aymene.khaled@g.enp.edu.dz",
//   "meriem.mechouek@g.enp.edu.dz",
//   "anwar.zeghad.enp.uspn@gmail.com",
//   "bochra.neghra@g.enp.edu.dz",
//   "mourad_islam.fernane@g.enp.edu.dz",
//   "zine_ddine.labed@g.enp.edu.dz",
//   "ahcene_zakaria.aouanouk@g.enp.edu.dz",
//   "aymen.saidani@g.enp.edu.dz",
//   "meriem.aberkane@g.enp.edu.dz",
//   "alae.taklit@g.enp.edu.dz",
//   "mohamed_amine.bennouar@g.enp.edu.dz",
//   "bouthaina.lahouassa@g.enp.edu.dz",
//   "dahlia_sarah.salemi@g.enp.edu.dz",
//   "romaissa.bouteldja@g.enp.edu.dz",
// ],
