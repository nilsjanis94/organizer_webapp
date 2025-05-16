import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment } from '../../models/appointment.model';
import { catchError, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BookingFormComponent } from '../booking-form/booking-form.component';

@Component({
  selector: 'app-free-appointments',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatDividerModule, 
    MatSnackBarModule,
    BookingFormComponent
  ],
  templateUrl: './free-appointments.component.html',
  styleUrl: './free-appointments.component.scss'
})
export class FreeAppointmentsComponent implements OnInit {
  freeAppointments: Appointment[] = [];
  isLoading = false;
  selectedAppointment: Appointment | null = null;
  showBookingForm = false;

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFreeAppointments();
  }

  loadFreeAppointments(): void {
    this.isLoading = true;
    this.appointmentService.getFreeAppointments()
      .pipe(
        catchError(error => {
          console.error('Fehler beim Laden der freien Termine:', error);
          this.snackBar.open('Freie Termine konnten nicht geladen werden.', 'Schließen', { duration: 5000 });
          return of([]);
        })
      )
      .subscribe(appointments => {
        this.freeAppointments = appointments;
        this.isLoading = false;
      });
  }

  selectAppointment(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.showBookingForm = true;
  }

  handleBooking(event: any): void {
    this.appointmentService.bookAppointment(event)
      .pipe(
        catchError(error => {
          console.error('Fehler beim Buchen des Termins:', error);
          this.snackBar.open('Termin konnte nicht gebucht werden.', 'Schließen', { duration: 5000 });
          return of(null);
        })
      )
      .subscribe(appointment => {
        if (appointment) {
          this.snackBar.open('Termin erfolgreich gebucht!', 'Schließen', { duration: 3000 });
          this.cancelBooking();
          this.loadFreeAppointments();
        }
      });
  }

  cancelBooking(): void {
    this.selectedAppointment = null;
    this.showBookingForm = false;
  }

  viewCalendar(): void {
    this.router.navigate(['/calendar']);
  }

  formatTime(timeString: string): string {
    return timeString;
  }

  calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    let endHours = hours;
    let endMinutes = minutes + duration;
    
    if (endMinutes >= 60) {
      endHours += Math.floor(endMinutes / 60);
      endMinutes = endMinutes % 60;
    }
    
    // Format mit führenden Nullen
    const formattedHours = endHours.toString().padStart(2, '0');
    const formattedMinutes = endMinutes.toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}`;
  }
}
