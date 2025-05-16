import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from django.contrib.auth.models import User, Group, Permission
from django.db import IntegrityError

# Gruppen erstellen
admin_group, created = Group.objects.get_or_create(name='admin')
patient_group, created = Group.objects.get_or_create(name='patient')

# Admin-Benutzer erstellen
try:
    admin = User.objects.create_user(
        username='admin',
        email='admin@example.com',
        password='admin123',
        first_name='Admin',
        last_name='User',
        is_staff=True
    )
    admin.groups.add(admin_group)
    print(f"Admin-Benutzer erstellt: {admin.username}")
except IntegrityError:
    print("Admin-Benutzer existiert bereits.")
    admin = User.objects.get(username='admin')
    admin.groups.add(admin_group)
    
# Test-Patienten erstellen
try:
    patient = User.objects.create_user(
        username='patient1',
        email='patient1@example.com',
        password='patient123',
        first_name='Max',
        last_name='Mustermann'
    )
    patient.groups.add(patient_group)
    print(f"Patienten-Benutzer erstellt: {patient.username}")
except IntegrityError:
    print("Patienten-Benutzer existiert bereits.")
    
try:
    patient = User.objects.create_user(
        username='patient2',
        email='patient2@example.com',
        password='patient123',
        first_name='Erika',
        last_name='Musterfrau'
    )
    patient.groups.add(patient_group)
    print(f"Patienten-Benutzer erstellt: {patient.username}")
except IntegrityError:
    print("Patienten-Benutzer existiert bereits.")

print("Benutzer und Gruppen erfolgreich erstellt.") 