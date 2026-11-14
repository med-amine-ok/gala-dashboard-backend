from pathlib import Path

from django.test import SimpleTestCase

from .ticket_template import TICKET_TEMPLATE

LANDING_COPY = Path(__file__).resolve().parents[2] / 'gala-landing' / 'src' / 'lib' / 'email' / 'ticket-template.ts'
START, END = '<!--TICKET-TEMPLATE-START-->', '<!--TICKET-TEMPLATE-END-->'


class TicketTemplateTests(SimpleTestCase):
    def test_same_template_as_the_landing_site(self):
        """Both senders must send the very same ticket email."""
        if not LANDING_COPY.exists():
            self.skipTest('landing site not checked out next to the backend')
        ts = LANDING_COPY.read_text(encoding='utf-8')
        landing = ts[ts.index(START):ts.index(END) + len(END)]
        self.assertEqual(TICKET_TEMPLATE.replace('\r\n', '\n'), landing.replace('\r\n', '\n'))
