import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './services/auth.service';
import { UserRole } from './models/auth.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <div class="app-container">
      <header class="app-header" *ngIf="authService.isAuthenticated()">
        <mat-toolbar color="primary">
          <span>Termin-Organizer</span>
          <div class="spacer"></div>
          <nav>
            <!-- Admin-Navigation -->
            <ng-container *ngIf="authService.isAdmin()">
              <a mat-button routerLink="/calendar" routerLinkActive="active" (click)="navigateToCalendar()">
                <mat-icon>calendar_month</mat-icon> Kalenderansicht
              </a>
            </ng-container>
            
            <!-- Patientennavigation -->
            <a mat-button routerLink="/free-appointments" routerLinkActive="active">
              <mat-icon>event_available</mat-icon> Verfügbare Termine
            </a>
            
            <!-- Benutzermenü -->
            <button mat-button [matMenuTriggerFor]="userMenu">
              <mat-icon>account_circle</mat-icon>
              {{ authService.currentUser()?.username }}
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item (click)="logout()">
                <mat-icon>exit_to_app</mat-icon>
                Abmelden
              </button>
            </mat-menu>
          </nav>
        </mat-toolbar>
      </header>
      <main class="app-content">
        <router-outlet></router-outlet>
      </main>
      <footer class="app-footer" *ngIf="authService.isAuthenticated()">
        <p>&copy; 2023 Termin-Organizer</p>
      </footer>
    </div>
  `,
  styles: `
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      font-family: 'Roboto', Arial, sans-serif;
    }
    
    .app-header {
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    mat-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .spacer {
      flex: 1 1 auto;
    }
    
    nav {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    
    .active {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .app-content {
      flex: 1;
      padding: 1rem;
      background-color: #f8f9fa;
    }
    
    .app-footer {
      background-color: #2c3e50;
      color: white;
      text-align: center;
      padding: 0.5rem;
      font-size: 0.8rem;
    }

    a {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `
})
export class AppComponent implements OnInit {
  title = 'Termin-Organizer';
  
  constructor(public authService: AuthService, private router: Router) {}
  
  ngOnInit(): void {
    // Ladehinweis ausblenden, wenn die App geladen ist
    const loadingElement = document.querySelector('.pre-bootstrap') as HTMLElement;
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }
  
  navigateToCalendar(): void {
    console.log('Navigation zur Kalender-Ansicht wurde ausgelöst');
    
    // Direkter Zugriff auf die Hash-URL für die Navigation
    window.location.hash = '/calendar';
    console.log('Hash-Navigation durchgeführt zu:', window.location.hash);
    
    // Alternative Router-Navigation
    // this.router.navigate(['/calendar']).then(() => {
    //   console.log('Router-Navigation abgeschlossen');
    // }).catch(err => {
    //   console.error('Router-Navigation fehlgeschlagen:', err);
    // });
  }
  
  logout(): void {
    this.authService.logout();
  }
}
