import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment, AppointmentBookingRequest } from '../../models/appointment.model';
import { AppointmentDialogComponent } from '../appointment-dialog/appointment-dialog.component';
import { BookingFormComponent } from '../booking-form/booking-form.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { catchError, of } from 'rxjs';
import { formatDate } from '@angular/common';
import { AuthService } from '../../services/auth.service';

interface CalendarDay {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  events: Appointment[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule, // Stellt sicher, dass MatCardModule verfügbar ist
    MatSnackBarModule,
    BookingFormComponent
  ],
  templateUrl: './calendar.component.html',
  styles: `
    .calendar-container {
      padding: 20px;
      position: relative;
    }

    .calendar-header {
      margin-bottom: 20px;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .loading-spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left-color: #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .simple-calendar {
      margin-bottom: 30px;
    }

    .calendar-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .calendar-grid {
      display: flex;
      flex-direction: column;
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      font-weight: bold;
      background-color: #f0f0f0;
      border-bottom: 1px solid #ddd;
    }

    .weekday {
      padding: 10px;
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }

    .day {
      padding: 10px;
      min-height: 60px;
      border: 1px solid #ddd;
      cursor: pointer;
    }

    .day:hover {
      background-color: #f5f5f5;
    }

    .day.current-month {
      background-color: #fff;
    }

    .day:not(.current-month) {
      background-color: #f9f9f9;
      color: #aaa;
    }

    .day.has-events {
      background-color: #e8f4fd;
    }

    .day-number {
      font-weight: bold;
    }

    .event-indicator {
      font-size: 0.8em;
      margin-top: 5px;
      padding: 2px 4px;
      background-color: #4caf50;
      color: white;
      border-radius: 3px;
      text-align: center;
    }

    .events-list {
      margin-top: 20px;
    }

    .event-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
      margin-top: 10px;
    }

    .event-card {
      margin-bottom: 10px;
    }
  `
})
export class CalendarComponent implements OnInit {
  selectedAppointment = signal<Appointment | null>(null);
  showBookingForm = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  
  // Kalenderdaten
  currentDate = signal<Date>(new Date());
  calendarDays = signal<CalendarDay[]>([]);
  selectedDay = signal<CalendarDay | null>(null);
  appointments = signal<Appointment[]>([]);
  
  // Formatierte Daten für die Anzeige
  currentMonthYear = signal<string>('');
  selectedDayFormatted = signal<string>('');
  selectedDayEvents = signal<Appointment[]>([]);

  constructor(
    private appointmentService: AppointmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // Explizit isLoading auf false setzen, falls es aus einem früheren Laden noch auf true steht
    this.isLoading.set(false);
    
    // Debug-Ausgabe für die Admin-Erkennung hinzufügen
    console.log('isAdmin Signal Wert:', this.authService.isAdmin());
    console.log('authService aktueller Benutzer:', this.authService.currentUser());
    console.log('authService userRole:', this.authService.userRole());
    
    // Sofortiger Fallback: Testdaten verwenden, wenn keine API-Verbindung möglich
    setTimeout(() => {
      // Wenn nach 3 Sekunden noch keine Termine geladen wurden, Testdaten anzeigen
      if (this.appointments().length === 0) {
        this.loadTestData();
      }
    }, 3000);
    
    // Versuche, echte Termine zu laden
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading.set(true);
    console.log('Versuche Termine zu laden...');
    console.log('Ist Admin (direkte Prüfung):', this.authService.checkIsAdmin());
    
    // Setze ein Timeout, um den Ladevorgang im Fehlerfall abzubrechen
    const loadingTimeout = setTimeout(() => {
      console.warn('Timeout beim Laden der Termine - breche ab');
      this.isLoading.set(false);
      this.snackBar.open('Zeitüberschreitung beim Laden der Termine. Bitte versuchen Sie es erneut.', 'Schließen', { duration: 5000 });
    }, 10000); // 10-Sekunden-Timeout
    
    // Unterscheidung zwischen Admin und Patient basierend auf dem Signal-Wert
    const isAdminUser = this.authService.checkIsAdmin(); // Direkter Check statt Signal

    const loadAppointmentsObservable = isAdminUser
      ? this.appointmentService.getAppointments() // Admin sieht alle Termine
      : this.appointmentService.getFreeAppointments(); // Patient sieht nur freie Termine
      
    loadAppointmentsObservable
      .pipe(
        catchError(error => {
          console.error('Fehler beim Laden der Termine:', error);
          this.snackBar.open('Termine konnten nicht geladen werden.', 'Schließen', { duration: 5000 });
          clearTimeout(loadingTimeout);
          this.isLoading.set(false);
          return of([]);
        })
      )
      .subscribe({
        next: appointments => {
          console.log('Geladene Termine:', appointments);
          this.appointments.set(appointments);
          
          // Wenn der Benutzer kein Admin ist, auch seine gebuchten Termine laden
          const currentUser = this.authService.currentUser();
          if (!isAdminUser && currentUser) {
            // Versuche, die Termine des Benutzers zu laden
            this.loadUserAppointments();
          } else {
            this.generateCalendar();
          }
          
          clearTimeout(loadingTimeout);
          this.isLoading.set(false);
        },
        complete: () => {
          clearTimeout(loadingTimeout);
          this.isLoading.set(false);
        }
      });
  }
  
  generateCalendar(): void {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Monat und Jahr für die Anzeige formatieren
    this.currentMonthYear.set(
      formatDate(date, 'MMMM yyyy', 'de-DE')
    );
    
    // Ersten Tag des Monats ermitteln
    const firstDayOfMonth = new Date(year, month, 1);
    // Letzten Tag des Monats ermitteln
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Wochentag des ersten Tags (0 = Sonntag, 1 = Montag, ...)
    let startDay = firstDayOfMonth.getDay() - 1; // Für Montag als ersten Tag
    if (startDay === -1) startDay = 6; // Sonntag ist 6 in unserem System
    
    // Kalendertage generieren
    const days: CalendarDay[] = [];
    
    // Tage aus dem vorherigen Monat hinzufügen
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push({
        day: day,
        month: month - 1 < 0 ? 11 : month - 1,
        year: month - 1 < 0 ? year - 1 : year,
        isCurrentMonth: false,
        events: []
      });
    }
    
    // Tage des aktuellen Monats hinzufügen
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true,
        events: []
      });
    }
    
    // Tage des nächsten Monats hinzufügen, um das Raster zu füllen
    const remainingDays = 42 - days.length; // 7x6 Grid für einen vollständigen Kalender
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: month + 1 > 11 ? 0 : month + 1,
        year: month + 1 > 11 ? year + 1 : year,
        isCurrentMonth: false,
        events: []
      });
    }
    
    // Termine den Tagen zuordnen
    const allAppointments = this.appointments();
    for (const appointment of allAppointments) {
      const appDate = new Date(appointment.date);
      
      // Finde den entsprechenden Tag im Kalender
      for (const day of days) {
        if (day.day === appDate.getDate() && 
            day.month === appDate.getMonth() && 
            day.year === appDate.getFullYear()) {
          day.events.push(appointment);
          break;
        }
      }
    }
    
    this.calendarDays.set(days);
  }
  
  previousMonth(): void {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.currentDate.set(newDate);
    this.generateCalendar();
  }
  
  nextMonth(): void {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.currentDate.set(newDate);
    this.generateCalendar();
  }
  
  selectDay(day: CalendarDay): void {
    this.selectedDay.set(day);
    
    // Formatiertes Datum für die Anzeige
    const date = new Date(day.year, day.month, day.day);
    this.selectedDayFormatted.set(formatDate(date, 'dd.MM.yyyy', 'de-DE'));
    
    // Termine für diesen Tag filtern
    this.selectedDayEvents.set(day.events);
    
    // Entfernung des automatischen Öffnens des Dialogs beim Klicken auf einen Tag
    // Admin muss jetzt explizit den "Neuen Termin erstellen"-Button verwenden
  }
  
  calculateEndTime(appointment: Appointment): string {
    const [hours, minutes] = appointment.start_time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes + appointment.duration;
    
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }
  
  handleEventClick(appointment: Appointment): void {
    if (appointment.status === 'free') {
      this.openAppointmentDialog(appointment);
    } else {
      this.viewAppointmentDetails(appointment);
    }
  }

  openAppointmentDialog(appointment: Appointment): void {
    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: '600px',
      data: { 
        appointment: appointment,
        mode: 'edit'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.appointmentService.updateAppointment(result.id as number, result)
          .pipe(
            catchError(error => {
              console.error('Fehler beim Aktualisieren des Termins:', error);
              this.snackBar.open('Termin konnte nicht aktualisiert werden.', 'Schließen', { duration: 5000 });
              return of(null);
            })
          )
          .subscribe(updatedAppointment => {
            if (updatedAppointment) {
              this.snackBar.open('Termin erfolgreich aktualisiert!', 'Schließen', { duration: 3000 });
              this.loadAppointments();
            }
          });
      }
    });
  }

  viewAppointmentDetails(appointment: Appointment): void {
    this.dialog.open(AppointmentDialogComponent, {
      width: '600px',
      data: { 
        appointment: appointment,
        mode: 'view'
      }
    });
  }

  showBookingFormForAppointment(appointment: Appointment): void {
    this.selectedAppointment.set(appointment);
    this.showBookingForm.set(true);
  }

  handleBooking(bookingRequest: AppointmentBookingRequest): void {
    this.appointmentService.bookAppointment(bookingRequest)
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
          this.hideBookingForm();
          this.loadAppointments();
        }
      });
  }

  hideBookingForm(): void {
    this.showBookingForm.set(false);
    this.selectedAppointment.set(null);
  }

  // Testdaten für Termine laden
  loadTestData(): void {
    console.log('%c TESTDATEN WERDEN GELADEN', 'background-color: green; color: white; font-size: 16px;');
    
    // Aktuelles Datum
    const today = new Date();
    
    // Ein einfaches Test-Termin-Array
    const testAppointments: Appointment[] = [];
    
    // 5 Test-Termine für heute hinzufügen
    for (let i = 0; i < 5; i++) {
      testAppointments.push({
        id: 1000 + i,
        title: `Test-Termin ${i + 1}`,
        description: `Dies ist ein Test-Termin Nr. ${i + 1}`,
        date: formatDate(today, 'yyyy-MM-dd', 'de-DE'),
        start_time: `${10 + i}:00`,
        duration: 30,
        status: i % 2 === 0 ? 'free' : 'booked',
        patient_name: i % 2 === 0 ? '' : 'Test-Patient',
        patient_email: i % 2 === 0 ? '' : 'test@example.com',
        patient_phone: i % 2 === 0 ? '' : '123456789'
      });
    }
    
    console.log('Erstellte Test-Termine:', testAppointments);
    
    // Test-Termine setzen
    this.appointments.set(testAppointments);
    
    // Direkt einen Tag auswählen, um Termine anzuzeigen
    this.generateCalendar();
    
    // Den heutigen Tag finden und auswählen
    const currentDay = this.calendarDays().find(day => 
      day.day === today.getDate() && 
      day.month === today.getMonth() && 
      day.year === today.getFullYear()
    );
    
    if (currentDay) {
      console.log('Heutigen Tag auswählen:', currentDay);
      this.selectDay(currentDay);
    }
    
    // UI aktualisieren erzwingen
    setTimeout(() => {
      // Erfolgs-Nachricht anzeigen
      this.snackBar.open(`${testAppointments.length} Test-Termine wurden geladen`, 'OK', { duration: 3000 });
    }, 100);
  }

  // Ladevorgang manuell stoppen für Notfälle
  stopLoading(): void {
    console.log('Ladevorgang manuell gestoppt');
    this.isLoading.set(false);
    this.snackBar.open('Ladevorgang abgebrochen', 'OK', { duration: 3000 });
    
    // Testdaten laden, um trotzdem eine Anzeige zu haben
    if (this.appointments().length === 0) {
      this.loadTestData();
    }
  }

  /**
   * Öffnet den Dialog zum Erstellen eines neuen Termins
   * Diese Funktion kann von Administratoren genutzt werden
   */
  createNewAppointment(date?: Date): void {
    // Prüfen ob der Benutzer ein Admin ist
    if (!this.authService.checkIsAdmin()) {
      this.snackBar.open('Nur Administratoren können neue Termine erstellen.', 'Schließen', { duration: 3000 });
      return;
    }
    
    const selectedDate = date || new Date();
    const formattedDate = formatDate(selectedDate, 'yyyy-MM-dd', 'de-DE');
    
    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: '500px',
      data: {
        mode: 'create',
        date: formattedDate
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.appointmentService.createAppointment(result).subscribe({
          next: (newAppointment) => {
            this.snackBar.open('Termin wurde erfolgreich erstellt!', 'Schließen', { duration: 3000 });
            this.loadAppointments(); // Kalender aktualisieren
          },
          error: (error) => {
            console.error('Fehler beim Erstellen des Termins:', error);
            this.snackBar.open('Der Termin konnte nicht erstellt werden.', 'Schließen', { duration: 3000 });
          }
        });
      }
    });
  }

  // Neue Methode zum Laden der Termine des angemeldeten Benutzers
  loadUserAppointments(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.email) {
      this.generateCalendar();
      return;
    }
    
    // Funktion für Benutzer-spezifische Termine hinzufügen
    this.appointmentService.getUserAppointments(currentUser.email)
      .pipe(
        catchError(error => {
          console.error('Fehler beim Laden der Benutzer-Termine:', error);
          // Fallback: Alle Termine laden und nach E-Mail filtern
          this.fallbackLoadUserAppointments(currentUser.email);
          return of([]);
        })
      )
      .subscribe(userAppointments => {
        if (userAppointments && userAppointments.length > 0) {
          // Bestehende Termine mit den Benutzerterminen zusammenführen
          const allAppointments = [
            ...this.appointments(),
            ...userAppointments
          ];
          
          this.appointments.set(allAppointments);
        }
        this.generateCalendar();
      });
  }
  
  // Fallback, wenn der Backend-Endpunkt für Benutzertermine nicht existiert
  fallbackLoadUserAppointments(email: string): void {
    console.log('Verwende Fallback-Methode zum Laden der Benutzertermine');
    
    // Da der Benutzer-Endpunkt fehlt oder einen Fehler zurückgibt,
    // führen wir trotzdem die Calendar-Generierung durch, aber ohne Benutzerdaten
    this.generateCalendar();
    
    // Optionales Laden aller Termine (nur für Admins)
    if (this.authService.checkIsAdmin()) {
      this.appointmentService.getAppointments()
        .subscribe({
          next: (allAppointments) => {
            // Filtere Termine, bei denen die E-Mail übereinstimmt
            const userAppointments = allAppointments.filter(
              appointment => appointment.patient_email === email && appointment.status === 'booked'
            );
            
            if (userAppointments.length > 0) {
              console.log(`${userAppointments.length} Termine für Benutzer ${email} gefunden`);
              
              // Bestehende Termine mit den gefilterten Benutzerterminen zusammenführen
              const combinedAppointments = [
                ...this.appointments(),
                ...userAppointments
              ];
              
              this.appointments.set(combinedAppointments);
              this.generateCalendar();
            }
          },
          error: (err) => {
            console.error('Fehler beim Laden aller Termine für Benutzer-Filterung:', err);
          }
        });
    }
  }
}

