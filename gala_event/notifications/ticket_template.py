"""
The ticket email: the email itself IS the admission pass (no PDF).

Plain HTML with {{placeholders}}, filled (and HTML-escaped) by
notifications.emails.render_ticket_email. The landing site sends the very
same email from gala-landing/src/lib/email/ticket-template.ts: the template
text between the markers must stay IDENTICAL in both files
(notifications/tests_ticket_email.py checks it when both are present).
"""

TICKET_TEMPLATE = r'''<!--TICKET-TEMPLATE-START-->
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Your admission pass</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; }
  a { color:#E5E5E5; }
  @media (max-width:620px) {
    .gx-wrap { width:100% !important; }
    .gx-pad { padding-left:22px !important; padding-right:22px !important; }
    .gx-col { display:block !important; width:100% !important; box-sizing:border-box !important; }
    .gx-serial { font-size:10px !important; letter-spacing:1px !important; }
    .gx-col-r { border-left:0 !important; border-top:1px solid #E7D9C4 !important; }
    .gx-name { font-size:26px !important; }
    .gx-title { font-size:24px !important; }
    .gx-btn { display:block !important; width:100% !important; margin:0 0 10px 0 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#1B0312;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">{{preheader}}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1B0312"
       style="background-color:#1B0312;background-image:url('{{pattern_url}}');background-repeat:repeat;">
  <tr>
    <td align="center" style="padding:36px 12px 40px 12px;">
      <table role="presentation" class="gx-wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

        <!-- The house's mark and the welcome -->
        <tr>
          <td align="center" class="gx-pad" style="padding:0 40px 26px 40px;">
            <img src="{{logo_url}}" width="200" alt="Engineers' Gala" style="display:block;width:200px;max-width:62%;height:auto;border:0;outline:none;margin:0 auto;">
            <div style="margin-top:18px;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#C0C0C0;">&#10022;&nbsp; Payment confirmed &nbsp;&#10022;</div>
            <h1 class="gx-title" style="margin:12px 0 0 0;font-family:Cinzel,'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;font-weight:700;color:#F2E8D8;">Your admission pass</h1>
            <p style="margin:14px 0 0 0;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:#E2D3DC;">{{greeting}} your seat is confirmed. This email is your ticket: show the QR code below at the entrance, on your phone or printed.</p>
          </td>
        </tr>

        <!-- THE TICKET -->
        <tr>
          <td style="padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="border-collapse:separate;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,0.45);">

              <!-- Header: plum velvet, silver mark -->
              <tr>
                <td bgcolor="#3A0827" class="gx-pad"
                    style="background-color:#3A0827;background-image:url('{{pattern_url}}');background-repeat:repeat;padding:26px 34px 22px 34px;border-bottom:2px solid #C0C0C0;border-radius:18px 18px 0 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" style="font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#C0C0C0;">Admission pass</td>
                      <td valign="middle" align="right" class="gx-serial" style="font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:12px;font-weight:700;letter-spacing:2px;color:#E5E5E5;">N&ordm;&nbsp;{{serial}}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-top:12px;font-family:Cinzel,'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;font-weight:700;letter-spacing:1px;color:#FFFFFF;" class="gx-title">{{event_name}}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-top:8px;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;line-height:1.4;color:#E2D3DC;">An evening of ambition, connection &amp; opportunity</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- The guest and the evening -->
              <tr>
                <td bgcolor="#FAF5EC" class="gx-pad" style="background-color:#FAF5EC;padding:26px 34px 8px 34px;">
                  <div style="font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#8E1B60;">Guest</div>
                  <div class="gx-name" style="margin-top:6px;font-family:Cinzel,'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:700;color:#2E061E;">{{guest_name}}</div>
                </td>
              </tr>
              <tr>
                <td bgcolor="#FAF5EC" class="gx-pad" style="background-color:#FAF5EC;padding:16px 34px 24px 34px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border:1px solid #E7D9C4;border-radius:12px;">
                    <tr>
                      <td class="gx-col" width="50%" valign="top" style="padding:14px 16px;">
                        <div style="font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#75325A;">Date</div>
                        <div style="margin-top:5px;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;line-height:1.4;color:#2E061E;">{{date}}</div>
                      </td>
                      <td class="gx-col gx-col-r" width="50%" valign="top" style="padding:14px 16px;border-left:1px solid #E7D9C4;">
                        <div style="font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#75325A;">Venue</div>
                        <div style="margin-top:5px;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;line-height:1.4;color:#2E061E;">
                          <a href="{{map_url}}" target="_blank" style="color:#8E1B60;text-decoration:underline;text-decoration-color:#C99AB6;">{{venue_name}}</a><br>
                          <span style="font-weight:400;color:#75325A;">{{venue_city}}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td class="gx-col" width="50%" valign="top" style="padding:14px 16px;border-top:1px solid #E7D9C4;">
                        <div style="font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#75325A;">Admits</div>
                        <div style="margin-top:5px;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;line-height:1.4;color:#2E061E;">One guest</div>
                      </td>
                      <td class="gx-col gx-col-r" width="50%" valign="top" style="padding:14px 16px;border-top:1px solid #E7D9C4;border-left:1px solid #E7D9C4;">
                        <div style="font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#75325A;">Entrance</div>
                        <div style="margin-top:5px;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;line-height:1.4;color:#2E061E;">{{price}} &middot; <span style="color:#2F7A4F;">Paid</span></div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Perforation: two notches and a dotted tear line -->
              <tr>
                <td bgcolor="#FAF5EC" style="background-color:#FAF5EC;padding:0;line-height:0;font-size:0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="16" height="32" bgcolor="#1B0312" style="width:16px;height:32px;background-color:#1B0312;border-radius:0 16px 16px 0;font-size:0;line-height:0;">&nbsp;</td>
                      <td style="padding:0 10px;"><div style="border-top:2px dashed #D9C6AE;height:0;line-height:0;font-size:0;">&nbsp;</div></td>
                      <td width="16" height="32" bgcolor="#1B0312" style="width:16px;height:32px;background-color:#1B0312;border-radius:16px 0 0 16px;font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- The stub: the QR code -->
              <tr>
                <td bgcolor="#FAF5EC" align="center" class="gx-pad" style="background-color:#FAF5EC;padding:12px 34px 28px 34px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                    <tr>
                      <td align="center" bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:2px solid #C0C0C0;border-radius:14px;padding:14px;">
                        <img src="{{qr_src}}" width="200" height="200" alt="Your ticket's QR code" style="display:block;width:200px;height:200px;border:0;outline:none;">
                      </td>
                    </tr>
                  </table>
                  <div style="margin-top:14px;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#8E1B60;">Scan at the entrance</div>
                  <div style="margin-top:6px;font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:15px;font-weight:700;letter-spacing:3px;color:#2E061E;">{{serial}}</div>
                  <div style="margin-top:6px;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;color:#75325A;">Personal &middot; admits one &middot; valid for a single scan</div>
                </td>
              </tr>

              <!-- Footer band -->
              <tr>
                <td bgcolor="#2E061E" align="center"
                    style="background-color:#2E061E;background-image:url('{{pattern_url}}');background-repeat:repeat;border-top:2px solid #C0C0C0;border-radius:0 0 18px 18px;padding:14px 20px;font-family:Cinzel,'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:3px;color:#E5E5E5;">
                  &#10022;&nbsp; ENGINEERS&rsquo; GALA &nbsp;&#10022;
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Directions and calendar -->
        <tr>
          <td align="center" style="padding:28px 0 0 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td class="gx-btn" align="center" bgcolor="#8E1B60" style="background-color:#8E1B60;border-radius:999px;">
                  <a href="{{map_url}}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.4px;color:#FFFFFF;text-decoration:none;border-radius:999px;">Directions to {{venue_name}}&nbsp;&rarr;</a>
                </td>
                <td class="gx-btn" width="12" style="width:12px;font-size:0;line-height:0;">&nbsp;</td>
                <td class="gx-btn" align="center" style="border:1px solid #C0C0C0;border-radius:999px;">
                  <a href="{{calendar_url}}" target="_blank" style="display:inline-block;padding:12px 26px;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.4px;color:#F2E8D8;text-decoration:none;border-radius:999px;">Add to my calendar</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Small print -->
        <tr>
          <td align="center" class="gx-pad" style="padding:26px 40px 0 40px;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#B9A2B0;">
            Keep this email until the evening and don't share the QR code: it opens the door only once.<br>
            {{app_tip}}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:26px 20px 0 20px;">
            <div style="height:1px;line-height:1px;font-size:0;background-color:#5D0D3D;">&nbsp;</div>
            <div style="margin-top:18px;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#9C7A8C;">
              {{organiser}}<br>
              <a href="{{site_url}}" style="color:#C0C0C0;text-decoration:none;">{{site_label}}</a><br>
              You receive this email because you registered for the {{event_name}}.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
<!--TICKET-TEMPLATE-END-->'''
