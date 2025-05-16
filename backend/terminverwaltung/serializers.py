from rest_framework import serializers
from .models import Termin

class TerminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Termin
        fields = ['id', 'titel', 'beschreibung', 'datum', 'uhrzeit', 
                  'dauer_minuten', 'patient_name', 'patient_email', 
                  'patient_telefon', 'status', 'erstellt_am', 'aktualisiert_am']
