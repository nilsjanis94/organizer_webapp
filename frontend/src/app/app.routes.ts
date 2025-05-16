import { Routes } from '@angular/router';
import { CalendarComponent } from './components/calendar/calendar.component';
import { FreeAppointmentsComponent } from './components/free-appointments/free-appointments.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './services/auth.guard';
import { UserRole } from './models/auth.model';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'calendar', 
    component: CalendarComponent,
    canActivate: [authGuard],
    // Kein RequiredRole mehr, die Komponente selbst überprüft die Admin-Rolle
  },
  { 
    path: 'free-appointments', 
    component: FreeAppointmentsComponent,
    canActivate: [authGuard]
  },
  // Fallback-Route
  { path: '**', redirectTo: '/login' }
];
