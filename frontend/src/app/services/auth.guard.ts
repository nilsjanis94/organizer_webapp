import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/auth.model';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('Auth Guard aktiviert, überprüfe Authentifizierung...');
  
  // Prüfen, ob der Benutzer angemeldet ist (Token vorhanden)
  if (!authService.getToken()) {
    console.log('Auth Guard: Kein Token gefunden, leite zur Login-Seite weiter');
    router.navigate(['/login']);
    return false;
  }
  
  // Prüfen, ob eine bestimmte Rolle erforderlich ist
  const requiredRole = route.data['requiredRole'];
  if (!requiredRole) {
    // Keine spezifische Rolle erforderlich
    console.log('Auth Guard: Keine spezifische Rolle erforderlich, Zugriff erlaubt');
    return true;
  }
  
  // Explizite Rollenprüfung
  let hasRequiredRole = false;
  
  if (requiredRole === UserRole.ADMIN) {
    hasRequiredRole = authService.checkIsAdmin();
    console.log('Auth Guard: Admin-Rolle erforderlich, User ist Admin?', hasRequiredRole);
  } else if (requiredRole === UserRole.PATIENT) {
    hasRequiredRole = !authService.checkIsAdmin(); // Vereinfacht: Nicht-Admin = Patient
    console.log('Auth Guard: Patient-Rolle erforderlich, User ist Patient?', hasRequiredRole);
  }
  
  if (!hasRequiredRole) {
    console.log('Auth Guard: Benutzer hat nicht die erforderliche Rolle');
    // Zu unterschiedlichen Seiten weiterleiten, je nach Benutzerrolle
    if (authService.checkIsAdmin()) {
      router.navigate(['/calendar']);
    } else {
      router.navigate(['/free-appointments']);
    }
    return false;
  }
  
  console.log('Auth Guard: Zugriff erlaubt');
  return true;
}; 