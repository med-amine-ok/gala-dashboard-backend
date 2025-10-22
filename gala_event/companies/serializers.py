from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Company
from accounts.models import CustomUser

class CompanySerializer(serializers.ModelSerializer):
    """Full serializer for Company CRUD operations"""
    
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
   
    
    class Meta:
        model = Company
        fields = [
            'id',  'name', 'description', 'email', 'website', 
            'field', 'contact_person', 'phone', 'address',
            'logo', 'created_at', 'updated_at', 'password'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Remove password from validated data before creating Company"""
        # Remove password as it's not a Company model field
        validated_data.pop('password', None)
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Remove password from validated data before updating Company"""
        # Remove password as it's not a Company model field
        validated_data.pop('password', None)
        return super().update(instance, validated_data)

class CompanyListSerializer(serializers.ModelSerializer):
    """Simplified serializer for company lists (for dropdowns, etc.)"""
    
    class Meta:
        model = Company
        fields = ['id', 'name', 'logo']

class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating companies"""
    
    class Meta:
        model = Company
        fields = [
            'name', 'description', 'email', 'website', 
            'field', 'contact_person', 'phone', 'address',
            'logo'
        ]
    
    def validate_name(self, value):
        """Validate company name uniqueness"""
        if Company.objects.filter(name__iexact=value.strip()).exists():
            if self.instance and self.instance.name.lower() != value.strip().lower():
                raise serializers.ValidationError("A company with this name already exists.")
            elif not self.instance:
                raise serializers.ValidationError("A company with this name already exists.")
        return value.strip()