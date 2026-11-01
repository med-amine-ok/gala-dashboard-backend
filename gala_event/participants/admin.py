from django.contrib import admin

from .models import Feedback, Participant, ParticipantImage, ParticipantParticipantLink


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'email', 'participant_type', 'status', 'payment_status', 'registered_at')
    list_filter = ('status', 'payment_status', 'participant_type', 'university')
    search_fields = ('id', 'first_name', 'last_name', 'email', 'phone')
    readonly_fields = ('id', 'public_token', 'registered_at', 'updated_at', 'approved_by', 'approved_at')
    raw_id_fields = ('user',)


admin.site.register(Feedback)
admin.site.register(ParticipantImage)
admin.site.register(ParticipantParticipantLink)
