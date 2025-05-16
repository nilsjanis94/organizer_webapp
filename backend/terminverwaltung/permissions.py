from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Benutzerdefinierte Berechtigung, die nur Administratoren gewährt wird.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            (request.user.is_staff or request.user.groups.filter(name='admin').exists())
        )

class IsPatient(permissions.BasePermission):
    """
    Benutzerdefinierte Berechtigung für normale Patienten.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            not request.user.is_staff and
            not request.user.groups.filter(name='admin').exists()
        )

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Erlaubt den Zugriff nur dem Besitzer des Termins oder einem Administrator.
    """
    def has_object_permission(self, request, view, obj):
        is_admin = request.user.is_staff or request.user.groups.filter(name='admin').exists()
        is_owner = hasattr(obj, 'patient_email') and obj.patient_email == request.user.email
        
        return is_admin or is_owner 