from rest_framework import serializers
from .models import Company

class CompanySerializer(serializers.ModelSerializer):
    """Full serializer for Company CRUD operations"""
    participants_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'description', 'email', 'website', 
            'field', 'contact_person', 'phone', 'address',
            'logo', 'participants_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'participants_count', 'created_at', 'updated_at']
    
    # def validate_hiring_positions(self, value):
    #     """Validate that hiring_positions is a list of strings"""
    #     if not isinstance(value, list):
    #         raise serializers.ValidationError("Hiring positions must be a list.")
        
    #     for position in value:
    #         if not isinstance(position, str):
    #             raise serializers.ValidationError("Each hiring position must be a string.")
    #         if len(position.strip()) == 0:
    #             raise serializers.ValidationError("Hiring position cannot be empty.")
        
    #     return value

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