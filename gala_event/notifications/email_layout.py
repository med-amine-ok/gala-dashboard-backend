"""
Branded HTML email layout for the Engineers' Gala (backend copy).

Same design as the landing site's gala-landing/src/lib/email/layout.ts:
600px table layout, inline styles, bulletproof button, web fonts with safe
fallbacks, hidden preheader, light colour scheme, every value HTML-escaped.
Keep both files in sync when changing colours or structure.
"""
from html import escape

from django.conf import settings

BRAND = {
    'plum': '#2E061E',
    'maroon': '#5D0D3D',
    'magenta': '#8E1B60',
    'silver': '#C0C0C0',
    'cream': '#F2E8D8',
    'cream_soft': '#FAF7F2',
    'cream_muted': '#EADDC8',
    'text': '#4B1A38',
    'text_muted': '#75325A',
}

EVENT = {
    'name': "Engineers' Gala 2026",
    'date': '8 November 2026',
    'venue': 'Hotel Mercure, Bab Ezzouar · Algiers',
    'price': '1,000 DA',
    'organiser': 'Vision & Innovation Club · École Nationale Polytechnique',
}

SERIF = "Cinzel, 'Cormorant Garamond', Georgia, 'Times New Roman', serif"
SANS = "'Plus Jakarta Sans', 'Segoe UI', Helvetica, Arial, sans-serif"
MONO = "'SFMono-Regular', Consolas, 'Courier New', monospace"


def esc(value):
    return escape(str(value if value is not None else ''), quote=True)


def site_url():
    return settings.LANDING_URL.rstrip('/')


def _paragraph(text):
    return (f'<p style="margin:0 0 16px 0;font-family:{SANS};font-size:15px;line-height:1.65;'
            f'color:{BRAND["text"]};">{esc(text)}</p>')


def _button(label, url):
    b = BRAND
    return f'''
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 8px auto;">
  <tr>
    <td align="center" bgcolor="{b['magenta']}" style="border-radius:999px;background:{b['magenta']};background-image:linear-gradient(135deg,{b['magenta']},{b['maroon']});">
      <a href="{esc(url)}" target="_blank"
         style="display:inline-block;padding:15px 38px;font-family:{SANS};font-size:15px;font-weight:700;letter-spacing:0.4px;color:#FFFFFF;text-decoration:none;border-radius:999px;">
        {esc(label)}&nbsp;&rarr;
      </a>
    </td>
  </tr>
</table>
<p style="margin:10px 0 0 0;text-align:center;font-family:{SANS};font-size:11px;line-height:1.5;color:{b['text_muted']};">
  Button not working? Copy this link:<br>
  <a href="{esc(url)}" style="color:{b['magenta']};word-break:break-all;">{esc(url)}</a>
</p>'''


def _highlight(label, value, monospace=False, large=False):
    b = BRAND
    font = MONO if monospace else SERIF
    spacing = '10px' if large else '3px' if monospace else '1px'
    size = '38px' if large else '24px'
    css_class = '' if large else 'gala-code'
    return f'''
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;">
  <tr>
    <td align="center" bgcolor="{b['plum']}" style="background:{b['plum']};background-image:linear-gradient(135deg,{b['plum']},{b['maroon']});border-radius:14px;padding:22px 16px;">
      <div style="font-family:{SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:{b['silver']};">{esc(label)}</div>
      <div class="{css_class}" style="margin-top:8px;font-family:{font};font-size:{size};line-height:1.3;letter-spacing:{spacing};font-weight:700;color:#FFFFFF;word-break:break-all;">{esc(value)}</div>
    </td>
  </tr>
</table>'''


def _details(rows):
    b = BRAND
    cells = []
    for i, (label, value) in enumerate(rows):
        border = f'border-top:1px solid {b["cream_muted"]};' if i else ''
        cells.append(f'''
  <tr>
    <td style="padding:12px 18px;{border}font-family:{SANS};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:{b['text_muted']};width:34%;">{esc(label)}</td>
    <td style="padding:12px 18px;{border}font-family:{SANS};font-size:14px;font-weight:600;color:{b['plum']};">{esc(value)}</td>
  </tr>''')
    return f'''
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="margin:24px 0 4px 0;background:{b['cream_soft']};border:1px solid {b['cream_muted']};border-radius:12px;border-collapse:separate;">
  {''.join(cells)}
</table>'''


def render_email_html(*, preheader, eyebrow, title, paragraphs, greeting=None,
                      highlight=None, cta=None, details=None, footnote=None):
    b = BRAND
    logo = f"{site_url()}/GALA-silver.png"
    body = ''.join([
        _paragraph(greeting) if greeting else '',
        ''.join(_paragraph(p) for p in paragraphs),
        _highlight(**highlight) if highlight else '',
        _button(cta['label'], cta['url']) if cta else '',
        _details(details) if details else '',
        (f'<p style="margin:22px 0 0 0;font-family:{SANS};font-size:12px;line-height:1.6;'
         f'color:{b["text_muted"]};">{esc(footnote)}</p>') if footnote else '',
    ])
    site = site_url()
    return f'''<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body {{ margin:0; padding:0; }}
  a {{ color:{b['magenta']}; }}
  @media (max-width:620px) {{
    .gala-card {{ width:100% !important; border-radius:0 !important; }}
    .gala-pad {{ padding-left:24px !important; padding-right:24px !important; }}
    .gala-title {{ font-size:24px !important; }}
    .gala-code {{ font-size:17px !important; letter-spacing:1px !important; }}
  }}
</style>
</head>
<body style="margin:0;padding:0;background:{b['cream']};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">{esc(preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{b['cream']}" style="background:{b['cream']};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" class="gala-card" width="600" cellpadding="0" cellspacing="0" border="0"
             style="width:600px;max-width:600px;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid {b['cream_muted']};">
        <tr>
          <td align="center" bgcolor="{b['plum']}"
              style="background:{b['plum']};background-image:radial-gradient(circle at 50% 0%,{b['magenta']} 0%,{b['maroon']} 45%,{b['plum']} 100%);padding:38px 24px 30px 24px;">
            <img src="{logo}" width="220" alt="Engineers' Gala" style="display:block;width:220px;max-width:70%;height:auto;border:0;outline:none;">
            <div style="margin-top:14px;font-family:{SANS};font-size:10px;letter-spacing:4px;text-transform:uppercase;color:{b['silver']};">Algiers &middot; {esc(EVENT['date'])}</div>
          </td>
        </tr>
        <tr><td style="height:3px;line-height:3px;font-size:0;background:{b['silver']};background-image:linear-gradient(90deg,{b['plum']},{b['silver']},{b['plum']});">&nbsp;</td></tr>
        <tr>
          <td class="gala-pad" style="padding:40px 48px 36px 48px;">
            <div style="font-family:{SANS};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:{b['magenta']};">{esc(eyebrow)}</div>
            <h1 class="gala-title" style="margin:10px 0 22px 0;font-family:{SERIF};font-size:28px;line-height:1.25;font-weight:700;color:{b['plum']};">{esc(title)}</h1>
            {body}
          </td>
        </tr>
        <tr>
          <td align="center" bgcolor="{b['cream_soft']}" style="background:{b['cream_soft']};border-top:1px solid {b['cream_muted']};padding:26px 32px;">
            <div style="font-family:{SERIF};font-size:14px;letter-spacing:2px;color:{b['plum']};">ENGINEERS&rsquo; GALA</div>
            <div style="margin-top:6px;font-family:{SANS};font-size:11px;line-height:1.6;color:{b['text_muted']};">
              {esc(EVENT['organiser'])}<br>
              <a href="{esc(site)}" style="color:{b['magenta']};text-decoration:none;">{esc(site.split('://', 1)[-1])}</a>
            </div>
            <div style="margin-top:12px;font-family:{SANS};font-size:10px;line-height:1.5;color:#9C7A8C;">
              You receive this email because you registered for the {esc(EVENT['name'])}.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>'''


def render_email_text(*, eyebrow, title, paragraphs, greeting=None, highlight=None,
                      cta=None, details=None, footnote=None, **_):
    lines = [eyebrow.upper(), title, '']
    if greeting:
        lines += [greeting, '']
    for p in paragraphs:
        lines += [p, '']
    if highlight:
        lines += [f"{highlight['label']}: {highlight['value']}", '']
    if cta:
        lines += [f"{cta['label']}: {cta['url']}", '']
    for label, value in details or []:
        lines.append(f'{label}: {value}')
    if details:
        lines.append('')
    if footnote:
        lines += [footnote, '']
    lines += [f"— {EVENT['name']}", EVENT['organiser'], site_url()]
    return '\n'.join(lines)


def render_email(**content):
    """Returns (html, text) for the given content (see render_email_html for keys)."""
    return render_email_html(**content), render_email_text(**content)
