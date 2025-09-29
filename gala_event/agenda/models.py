from django.db import models

class Speaker(models.Model):
    name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    photo = models.ImageField(upload_to='speakers/', blank=True, null=True)
    
    def __str__(self):
        return self.name

class Agenda(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    place = models.CharField(max_length=255)
    speakers = models.ManyToManyField(Speaker, related_name='agenda_items' , null=True , blank=True )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['start_time']


class AgendaRegistration(models.Model):
    
    agenda_item = models.ForeignKey(Agenda, on_delete=models.CASCADE, related_name='registrations')
    registered_at = models.DateTimeField(auto_now_add=True)
    attended = models.BooleanField(default=False)
    attendance_marked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.participant} - {self.agenda_item}"