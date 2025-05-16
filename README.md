# Termin-Organizer

Eine Webanwendung zur Verwaltung von Terminen mit einem Django-Backend und Angular-Frontend.

## Beschreibung

Diese Anwendung ermöglicht die Verwaltung von Terminen für Praxen oder andere Dienstleister. Administratoren können freie Termine erstellen, während Patienten diese buchen können.

## Funktionen

- **Benutzerverwaltung** mit Admin- und Patientenrollen
- **Terminverwaltung** (Erstellen, Anzeigen, Buchen, Löschen)
- **Kalenderansicht** zur übersichtlichen Darstellung der Termine
- **Responsive Benutzeroberfläche** mit Angular Material

## Technologien

### Backend
- Django (Python-Webframework)
- Django REST Framework
- SQLite-Datenbank (für Entwicklung)

### Frontend
- Angular 17+
- Angular Material
- TypeScript

## Installation

### Voraussetzungen
- Python 3.8+
- Node.js 20+
- npm oder yarn

### Backend-Setup
1. Ins Backend-Verzeichnis wechseln:
   ```
   cd backend
   ```
2. Virtuelle Python-Umgebung erstellen und aktivieren:
   ```
   python -m venv venv
   source venv/bin/activate  # Unter Windows: venv\Scripts\activate
   ```
3. Abhängigkeiten installieren:
   ```
   pip install -r requirements.txt
   ```
4. Datenbank-Migrationen ausführen:
   ```
   python manage.py migrate
   ```
5. Testdaten erstellen (optional):
   ```
   python create_users.py
   python create_appointments.py
   ```
6. Server starten:
   ```
   python manage.py runserver
   ```

### Frontend-Setup
1. Ins Frontend-Verzeichnis wechseln:
   ```
   cd frontend
   ```
2. Abhängigkeiten installieren:
   ```
   npm install
   ```
3. Entwicklungsserver starten:
   ```
   npm run start
   ```
4. Die Anwendung ist unter http://localhost:4200 erreichbar

## Nutzung

### Als Administrator
1. Einloggen mit Admin-Berechtigungen
2. Unter "Kalender" können neue freie Termine erstellt werden
3. Übersicht über alle Termine und deren Status einsehen

### Als Patient
1. Einloggen mit Patientenkonto oder registrieren
2. Freie Termine ansehen und buchen
3. Eigene gebuchte Termine einsehen

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.
