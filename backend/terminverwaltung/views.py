from django.shortcuts import render, get_object_or_404
from django.db import transaction
import urllib.parse
from rest_framework import viewsets, status
from .models import Termin
from .serializers import TerminSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from .permissions import IsAdmin, IsPatient, IsOwnerOrAdmin

# Endpunkt zum Abrufen von Benutzerinformationen
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_info(request):
    """
    Gibt Informationen über den aktuell eingeloggten Benutzer zurück,
    einschließlich seiner Berechtigungen und Rollen.
    """
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'groups': [group.name for group in user.groups.all()],
        'is_admin': user.is_staff or user.groups.filter(name='admin').exists(),
    })

# Create your views here.

class TerminViewSet(viewsets.ModelViewSet):
    queryset = Termin.objects.all()
    serializer_class = TerminSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['datum', 'status']
    
    def get_permissions(self):
        """
        Berechtigungen je nach Anfrageart zurückgeben.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Nur Administratoren dürfen Termine erstellen, bearbeiten oder löschen
            permission_classes = [IsAdmin]
        elif self.action == 'list':
            # Administratoren sehen alle Termine, Patienten nur ihre eigenen
            permission_classes = [IsAuthenticated]
        elif self.action in ['verfuegbar', 'benutzer']:
            # Freie Termine können von allen authentifizierten Nutzern gesehen werden
            permission_classes = [IsAuthenticated]
        elif self.action == 'buchen':
            # Nur Patienten können Termine buchen
            permission_classes = [IsAuthenticated]
        elif self.action == 'retrieve':
            # Admins können alle Termine sehen, Patienten nur ihre eigenen
            permission_classes = [IsOwnerOrAdmin]
        else:
            # Standard ist authentifizierter Zugriff
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def list(self, request, *args, **kwargs):
        """
        Liste alle Termine oder für Patienten nur ihre eigenen
        """
        user = request.user
        if IsAdmin().has_permission(request, self):
            # Administratoren sehen alle Termine
            queryset = self.filter_queryset(self.get_queryset())
        else:
            # Patienten sehen nur ihre eigenen Termine
            queryset = self.filter_queryset(
                Termin.objects.filter(patient_email=user.email)
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def verfuegbar(self, request):
        """
        Liste alle freien Termine für authentifizierte Nutzer
        """
        verfuegbare = Termin.objects.filter(status='frei')
        serializer = self.get_serializer(verfuegbare, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='benutzer/(?P<email>.*)')
    def benutzer(self, request, email=None):
        """
        Liste alle Termine eines bestimmten Benutzers (nach E-Mail)
        Der Parameter email kann URL-kodiert sein und wird automatisch dekodiert
        """
        # URL-Dekodierung der E-Mail-Adresse (falls kodiert)
        decoded_email = urllib.parse.unquote(email)
        print(f"Anfrage für Benutzertermine: {email} (dekodiert: {decoded_email})")
        
        # Prüfen ob der anfragende Benutzer Admin ist oder seine eigenen Termine abfragt
        if not (IsAdmin().has_permission(request, self) or request.user.email == decoded_email):
            return Response(
                {"detail": "Sie haben keine Berechtigung, diese Termine einzusehen."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Termine des Benutzers zurückgeben
        termine = Termin.objects.filter(patient_email=decoded_email)
        serializer = self.get_serializer(termine, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def buchen(self, request, pk=None):
        """
        Buche einen Termin, wenn er noch frei ist
        """
        with transaction.atomic():  # Transaktion für atomare Operation
            termin = self.get_object()
            
            # Erneut prüfen, ob der Termin noch frei ist (Wettlaufsituation vermeiden)
            if termin.status != 'frei':
                return Response(
                    {"detail": "Dieser Termin ist nicht mehr verfügbar."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Daten aktualisieren
            termin.patient_name = request.data.get('patient_name')
            termin.patient_email = request.user.email  # E-Mail des eingeloggten Benutzers
            termin.patient_telefon = request.data.get('patient_phone')
            termin.status = 'gebucht'
            termin.save()
            
            serializer = self.get_serializer(termin)
            return Response(serializer.data)
        
    def perform_create(self, serializer):
        """
        Prüfe vor dem Speichern eines neuen Termins, ob der Zeitslot noch frei ist
        """
        # Prüfen, ob Zeitslot bereits belegt ist
        datum = serializer.validated_data.get('datum')
        uhrzeit = serializer.validated_data.get('uhrzeit')
        if Termin.objects.filter(datum=datum, uhrzeit=uhrzeit).exists():
            raise ValidationError("Dieser Termin ist bereits vergeben.")
        serializer.save()
