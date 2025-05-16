import { Injectable, Signal, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { AuthRequest, AuthResponse, RefreshTokenRequest, User, UserRole } from '../models/auth.model';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;
  user_id: number;
  username: string;
  email?: string;
  is_staff?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8000/api';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  private userSubject = new BehaviorSubject<User | null>(this.getSavedUser());
  private tokenExpirationTimer: any;

  // Signals
  private currentUserSignal = signal<User | null>(this.getSavedUser());
  private isAuthenticatedSignal = signal<boolean>(!!this.getToken());
  private userRoleSignal = signal<UserRole>(this.getUserRole());
  
  // Computed Signals mit besserer Implementierung
  isAdmin = computed(() => {
    const role = this.userRoleSignal();
    const isAdminUser = role === UserRole.ADMIN;
    console.log('isAdmin computed signal ausgewertet:', isAdminUser);
    return isAdminUser;
  });

  isPatient = computed(() => this.userRoleSignal() === UserRole.PATIENT);
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initAuthFromStorage();
    
    // Debug-Ausgabe zur Überprüfung des aktuellen Benutzers
    const user = this.getSavedUser();
    console.log('Auth Service initialisiert');
    console.log('Gespeicherter Benutzer:', user);
    console.log('Ist Admin?', this.isAdmin());
  }

  // Öffentliche Signale für Komponentenzugriff
  get currentUser(): Signal<User | null> {
    return this.currentUserSignal;
  }

  get isAuthenticated(): Signal<boolean> {
    return this.isAuthenticatedSignal;
  }

  get userRole(): Signal<UserRole> {
    return this.userRoleSignal;
  }

  private initAuthFromStorage(): void {
    const token = this.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const expirationDate = new Date(decoded.exp * 1000);
        
        if (expirationDate <= new Date()) {
          // Token ist abgelaufen, versuche zu aktualisieren
          this.refreshToken().subscribe({
            next: () => {
              console.log('Token erfolgreich aktualisiert');
              this.setUpTokenExpiration();
            },
            error: () => {
              // Bei Fehler abmelden
              this.logout();
            }
          });
        } else {
          // Token ist noch gültig
          this.setUpTokenExpiration();
        }
      } catch (error) {
        console.error('Fehler beim Dekodieren des Tokens:', error);
        this.logout();
      }
    }
  }

  login(credentials: AuthRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/token/`, credentials).pipe(
      tap(response => {
        this.setSession(response);
        this.setUpTokenExpiration();
        
        // Benutzerinformationen aus dem Token extrahieren
        const decoded = jwtDecode<JwtPayload>(response.access);
        const user: User = {
          id: decoded.user_id,
          username: decoded.username,
          email: decoded.email || '',
          is_staff: decoded.is_staff
        };
        
        console.log('Login erfolgreich, Benutzerinformationen aus Token:', user);
        console.log('is_staff direkt aus Token:', decoded.is_staff);
        
        // Nach dem Login direkt die aktuellen Benutzerinformationen vom Server holen
        // Dies stellt sicher, dass alle Rollen und Berechtigungen korrekt sind
        this.verifyCurrentUser().subscribe({
          next: (verifiedUser) => {
            console.log('Aktualisierte Benutzerinformationen vom Server:', verifiedUser);
          },
          error: (err) => {
            console.error('Fehler beim Abrufen der Benutzerinformationen:', err);
          }
        });
        
        this.saveUser(user);
        this.userSubject.next(user);
        
        // Signal-Werte aktualisieren
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);
        this.userRoleSignal.set(this.getUserRole());
        
        // Debug-Ausgabe nach dem Setzen der Signale
        console.log('Nach Login - Ist Admin?', this.isAdmin());
      }),
      map(() => this.currentUserSignal()!)
    );
  }

  logout(): void {
    // Token aus dem Speicher entfernen
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Signal-Werte zurücksetzen
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.userRoleSignal.set(UserRole.UNKNOWN);
    
    // Subject aktualisieren
    this.userSubject.next(null);
    
    // Timer beenden
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
    
    // Zur Anmeldeseite navigieren
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      return throwError(() => new Error('Kein Refresh-Token verfügbar'));
    }
    
    const refreshRequest: RefreshTokenRequest = { refresh: refreshToken };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/token/refresh/`, refreshRequest).pipe(
      tap(response => {
        // Nur den Access-Token aktualisieren, Refresh-Token bleibt gleich
        localStorage.setItem(this.TOKEN_KEY, response.access);
        this.setUpTokenExpiration();
      }),
      catchError(error => {
        console.error('Fehler beim Token-Refresh:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.access);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refresh);
  }

  private saveUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getSavedUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private getUserRole(): UserRole {
    const user = this.getSavedUser();
    
    if (!user) {
      console.log('getUserRole: Kein Benutzer gefunden');
      return UserRole.UNKNOWN;
    }
    
    // Debug-Ausgaben hinzufügen
    console.log('getUserRole: Benutzer gefunden', user);
    console.log('is_staff:', user.is_staff);
    console.log('groups:', user.groups);
    
    if (user.is_staff === true || (user.groups && user.groups.includes('admin'))) {
      console.log('getUserRole: Benutzer ist ADMIN');
      return UserRole.ADMIN;
    }
    
    console.log('getUserRole: Benutzer ist PATIENT');
    return UserRole.PATIENT;
  }

  private setUpTokenExpiration(): void {
    const token = this.getToken();
    if (!token) return;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expirationDate = new Date(decoded.exp * 1000);
      const now = new Date();
      const timeUntilExpiry = expirationDate.getTime() - now.getTime();
      
      // Wenn der Token in weniger als 5 Minuten abläuft, aktualisieren
      const refreshTime = Math.max(0, timeUntilExpiry - (5 * 60 * 1000));
      
      // Timer beenden, falls er existiert
      if (this.tokenExpirationTimer) {
        clearTimeout(this.tokenExpirationTimer);
      }
      
      // Neuen Timer setzen
      this.tokenExpirationTimer = setTimeout(() => {
        this.refreshToken().subscribe();
      }, refreshTime);
      
    } catch (error) {
      console.error('Fehler beim Dekodieren des Tokens:', error);
    }
  }

  // Öffentliche Methode zum direkten Überprüfen der Admin-Rolle
  checkIsAdmin(): boolean {
    const user = this.getSavedUser();
    // Debug-Ausgabe für die Überprüfung
    console.log('checkIsAdmin aufgerufen, User:', user);
    
    if (!user) {
      console.log('checkIsAdmin: Kein Benutzer gefunden');
      return false;
    }
    
    // Explizite Prüfung mit striktem Vergleich
    // Berücksichtige auch das neue is_admin-Flag vom Backend
    const isAdmin = user.is_staff === true || 
                   (user.is_superuser === true) || 
                   (user.is_admin === true) ||
                   (Array.isArray(user.groups) && user.groups.includes('admin'));
    
    console.log('checkIsAdmin Ergebnis:', isAdmin, 'Details:', {
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
      is_admin: user.is_admin,
      groups: user.groups
    });
    
    return isAdmin;
  }
  
  // Direkter Zugriff auf die Backend-API um den aktuellen Benutzer zu prüfen
  verifyCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/current-user/`).pipe(
      tap(userData => {
        console.log('Benutzerinfo vom Server erhalten:', userData);
        
        // Benutzerobjekt mit den aktuellen Daten aktualisieren, 
        // insbesondere is_staff und is_admin
        const updatedUser: User = {
          ...userData,
          is_staff: userData.is_staff || userData.is_admin // Sicherstellen, dass is_staff gesetzt ist
        };
        
        // Aktualisiere die lokalen Benutzerdaten mit den neuesten Server-Daten
        this.saveUser(updatedUser);
        this.currentUserSignal.set(updatedUser);
        this.userRoleSignal.set(this.getUserRole());
        
        console.log('Benutzerinformationen aktualisiert, neuer Status:', {
          is_staff: updatedUser.is_staff,
          userRole: this.userRoleSignal(),
          isAdmin: this.isAdmin()
        });
      }),
      catchError(error => {
        console.error('Fehler beim Abrufen der Benutzerinformationen:', error);
        // Bei Fehler den Benutzer abmelden
        if (error.status === 401) {
          this.logout();
        }
        return throwError(() => error);
      })
    );
  }
}
