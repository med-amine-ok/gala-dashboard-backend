from django.db import models
from django.core.validators import EmailValidator, URLValidator
from accounts.models import CustomUser
from participants.models import Participant

class Company(models.Model):

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='company_profile', null=True, blank=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    email = models.EmailField(validators=[EmailValidator()])
    website = models.URLField(blank=True, null=True, validators=[URLValidator()])
    field = models.CharField(max_length=100, blank=True, null=True)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    
    
    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        ordering = ['name']


class CompanyParticipantLink(models.Model):
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE,
        related_name='participant_links'
    )
    participant = models.ForeignKey(
        Participant, 
        on_delete=models.CASCADE,
        related_name='company_links'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('company', 'participant')
        verbose_name = "Company-Participant Link"
        verbose_name_plural = "Company-Participant Links"
        
    def __str__(self):
        return f"{self.company.name} - {self.participant.full_name}"
