import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { AuthRequest } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  hidePassword = true;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const credentials = this.loginForm.value;

    this.authService.login(credentials)
      .pipe(
        catchError(error => {
          console.error('Login failed:', error);
          let errorMsg = 'Anmeldung fehlgeschlagen';
          if (error.status === 401) {
            errorMsg = 'Ungültiger Benutzername oder Passwort';
          }
          this.snackBar.open(errorMsg, 'Schließen', { duration: 5000 });
          this.loading = false;
          return of(null);
        })
      )
      .subscribe(user => {
        if (user) {
          this.snackBar.open('Anmeldung erfolgreich!', 'Schließen', { duration: 3000 });
          
          // Debug-Ausgabe für Admin-Erkennung
          console.log('Eingeloggt als:', user);
          console.log('---- BENUTZERINFORMATIONEN DETAILS ----');
          console.log('is_staff Flag:', user.is_staff);
          console.log('Benutzerrolle:', this.authService.userRole());
          console.log('Ist Admin nach checkIsAdmin():', this.authService.checkIsAdmin());
          console.log('User-Objekt im LocalStorage:', JSON.parse(localStorage.getItem('current_user') || '{}'));
          console.log('---- ENDE BENUTZERINFORMATIONEN ----');

          // Je nach Benutzerrolle zur entsprechenden Startseite navigieren
          if (this.authService.checkIsAdmin()) {
            this.router.navigate(['/calendar']);
          } else {
            this.router.navigate(['/free-appointments']);
          }
        }
        this.loading = false;
      });
  }
  
  // Direkte Demo-Login-Funktion
  loginAsAdmin() {
    // Setze Login-Formulardaten für Admin
    this.loginForm.setValue({
      username: 'admin',
      password: 'admin123'
    });
    
    // Als Admin anmelden
    this.onSubmit();
    
    // Nach der Anmeldung neue Benutzerinformationen vom Server holen
    setTimeout(() => {
      console.log('Hole aktuelle Benutzerinformationen vom Server...');
      
      this.authService.verifyCurrentUser().subscribe({
        next: (verifiedUser) => {
          console.log('Verifizierte Admin-Benutzerinformationen:', verifiedUser);
          
          // Sollte das is_staff Flag fehlen, manuell setzen
          if (!verifiedUser.is_staff && (verifiedUser.is_admin || 
             (verifiedUser.groups && verifiedUser.groups.includes('admin')))) {
            
            console.log('is_staff Flag fehlt, setze es explizit');
            const updatedUser = { ...verifiedUser, is_staff: true };
            this.authService['saveUser'](updatedUser);
            console.log('Aktualisierter Admin-Benutzer:', updatedUser);
            
            // Zur Kalender-Seite navigieren
            this.router.navigate(['/calendar']);
          }
        },
        error: (err) => console.error('Fehler bei der Admin-Verifizierung:', err)
      });
    }, 1000);
  }
}
