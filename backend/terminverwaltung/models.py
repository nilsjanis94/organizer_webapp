from django.db import models
from django.contrib.auth.models import User

class Termin(models.Model):
    STATUS_CHOICES = [
        ('frei', 'Frei'),
        ('gebucht', 'Gebucht')
    ]
    
    titel = models.CharField(max_length=200)
    beschreibung = models.TextField(blank=True, null=True)
    datum = models.DateField()
    uhrzeit = models.TimeField()
    dauer_minuten = models.IntegerField(default=30)
    patient_name = models.CharField(max_length=200, blank=True, null=True)
    patient_email = models.EmailField(blank=True, null=True)
    patient_telefon = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='frei')
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.datum} {self.uhrzeit} - {self.titel}"
        
    class Meta:
        unique_together = ['datum', 'uhrzeit']
