from rest_framework import serializers
from .models import Company

class CompanySerializer(serializers.ModelSerializer):
    """HR manages companies. The linked login account is created by the view
    (never re-used from an existing user) and cannot be re-pointed here."""
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'description', 'email', 'website',
            'field', 'contact_person', 'phone', 'address',
            'logo', 'created_at', 'updated_at', 'password', 'user'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

    def validate_email(self, value):
        return value.strip().lower()

    def validate_name(self, value):
        value = value.strip()
        qs = Company.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A company with this name already exists.")
        return value

    def create(self, validated_data):
        validated_data.pop('password', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('password', None)
        return super().update(instance, validated_data)


class CompanyListSerializer(serializers.ModelSerializer):
    """Simplified serializer for company lists (for dropdowns, etc.)"""
    
    class Meta:
        model = Company
        fields = ['id', 'name', 'logo']
