from django.contrib import admin
from .models import Termin

@admin.register(Termin)
class TerminAdmin(admin.ModelAdmin):
    list_display = ['titel', 'datum', 'uhrzeit', 'dauer_minuten']
    search_fields = ['titel', 'beschreibung']
    list_filter = ['datum']
