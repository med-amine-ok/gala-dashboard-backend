from django.db import models
from django.core.validators import EmailValidator, URLValidator

class Company(models.Model):
    
    
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
    
    @property
    def participants_count(self):
        return self.participants.count()
    
    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        ordering = ['name']