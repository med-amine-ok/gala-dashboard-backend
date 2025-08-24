from django.db import models

class Speaker(models.Model):
    name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    # You could link this to the Company model from the participants app
    # from gala_event.participants.models import Company
    # company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    photo = models.ImageField(upload_to='speakers/', blank=True, null=True)

    def __str__(self):
        return self.name

class AgendaItem(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    place = models.CharField(max_length=255)
    speakers = models.ManyToManyField(Speaker, blank=True, related_name='agenda_items')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['start_time']