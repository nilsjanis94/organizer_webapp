import os
import django
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from terminverwaltung.models import Termin
from django.db import IntegrityError

# Heutiges Datum
heute = datetime.date.today()
morgen = heute + datetime.timedelta(days=1)
uebermorgen = heute + datetime.timedelta(days=2)
naechste_woche = heute + datetime.timedelta(days=7)

# Freie Termine erstellen
termine = [
    # Heute
    {
        'titel': 'Routineuntersuchung',
        'beschreibung': 'Allgemeine Untersuchung',
        'datum': heute,
        'uhrzeit': '09:00',
        'dauer_minuten': 30,
        'status': 'frei'
    },
    {
        'titel': 'Vorsorgeuntersuchung',
        'beschreibung': 'Vorsorge-Checkup',
        'datum': heute,
        'uhrzeit': '10:00',
        'dauer_minuten': 45,
        'status': 'frei'
    },
    # Morgen
    {
        'titel': 'Beratungsgespräch',
        'beschreibung': 'Beratung zu Behandlungsoptionen',
        'datum': morgen,
        'uhrzeit': '14:00',
        'dauer_minuten': 30,
        'status': 'frei'
    },
    {
        'titel': 'Routineuntersuchung',
        'beschreibung': 'Allgemeine Untersuchung',
        'datum': morgen,
        'uhrzeit': '15:00',
        'dauer_minuten': 30,
        'status': 'frei'
    },
    # Übermorgen
    {
        'titel': 'Spezialuntersuchung',
        'beschreibung': 'Spezielle Diagnostik',
        'datum': uebermorgen,
        'uhrzeit': '11:00',
        'dauer_minuten': 60,
        'status': 'frei'
    },
    # Nächste Woche
    {
        'titel': 'Routineuntersuchung',
        'beschreibung': 'Allgemeine Untersuchung',
        'datum': naechste_woche,
        'uhrzeit': '09:30',
        'dauer_minuten': 30,
        'status': 'frei'
    },
]

# Bereits gebuchte Termine
gebuchte_termine = [
    {
        'titel': 'Kontrolluntersuchung',
        'beschreibung': 'Nachkontrolle',
        'datum': morgen,
        'uhrzeit': '16:00',
        'dauer_minuten': 30,
        'patient_name': 'Max Mustermann',
        'patient_email': 'patient1@example.com',
        'patient_telefon': '01234567890',
        'status': 'gebucht'
    },
    {
        'titel': 'Behandlung',
        'beschreibung': 'Folgebehandlung',
        'datum': uebermorgen,
        'uhrzeit': '14:30',
        'dauer_minuten': 45,
        'patient_name': 'Erika Musterfrau',
        'patient_email': 'patient2@example.com',
        'patient_telefon': '09876543210',
        'status': 'gebucht'
    }
]

# Termine in der Datenbank erstellen
created_count = 0
for termin_daten in termine + gebuchte_termine:
    try:
        termin = Termin.objects.create(**termin_daten)
        created_count += 1
    except IntegrityError:
        print(f"Termin für {termin_daten['datum']} um {termin_daten['uhrzeit']} existiert bereits.")

print(f"{created_count} Termine wurden erstellt.") 