import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  
  // Wenn es sich um eine Authentifizierungsanfrage handelt, keine Änderung notwendig
  if (req.url.includes('/token/')) {
    return next(req);
  }
  
  // Token aus dem Service abrufen
  const token = authService.getToken();
  
  if (token) {
    // Token zum Header hinzufügen
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }
  
  // Keine Änderung vornehmen, wenn kein Token vorhanden ist
  return next(req);
}; 