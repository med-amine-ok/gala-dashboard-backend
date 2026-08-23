from django.db import models

class Agenda(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    place = models.CharField(max_length=255)
    speakers = models.JSONField(default=list, blank=True)
    capacity = models.IntegerField(default=100)
    is_cancelled = models.BooleanField(default=False)
    requires_registration = models.BooleanField(default=False)
    event_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def duration_minutes(self):
        if self.end_time and self.start_time:
            return int((self.end_time - self.start_time).total_seconds() / 60)
        return 0

    @property
    def is_past(self):
        from django.utils import timezone
        return timezone.now() > self.end_time

    @property
    def is_ongoing(self):
        from django.utils import timezone
        now = timezone.now()
        return self.start_time <= now <= self.end_time

    @property
    def speakers_names(self):
        if isinstance(self.speakers, list):
            return ", ".join([s.get('name', '') for s in self.speakers if isinstance(s, dict)])
        return ""

    class Meta:
        ordering = ['start_time']


class AgendaRegistration(models.Model):
    agenda_item = models.ForeignKey(Agenda, on_delete=models.CASCADE, related_name='registrations')
    participant = models.ForeignKey('participants.Participant', on_delete=models.CASCADE, related_name='agenda_registrations')
    registered_at = models.DateTimeField(auto_now_add=True)
    attended = models.BooleanField(default=False)
    attendance_marked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.participant} - {self.agenda_item}"