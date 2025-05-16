import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TermineService, Termin } from '../../services/termine.service';
import { TerminDialogComponent } from '../termin-dialog/termin-dialog.component';
import { BuchungsFormularComponent } from '../buchungs-formular/buchungs-formular.component';

@Component({
  selector: 'app-kalender',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule,
    FullCalendarModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './kalender.component.html',
  styleUrl: './kalender.component.scss'
})
export class KalenderComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    weekends: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: [],
    editable: false,
    selectable: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventClassNames: (arg) => {
      const status = arg.event.extendedProps['status'];
      return ['termin-' + (status || 'frei')]; // CSS-Klasse basierend auf Status
    }
  };
  termine: Termin[] = [];
  
  constructor(
    private termineService: TermineService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadTermine();
  }
  
  loadTermine(): void {
    this.termineService.getTermine().subscribe({
      next: (termine) => {
        this.termine = termine;
        this.updateCalendarEvents();
      },
      error: (error) => {
        console.error('Fehler beim Laden der Termine', error);
        this.snackBar.open('Termine konnten nicht geladen werden.', 'OK', { duration: 3000 });
      }
    });
  }
  
  updateCalendarEvents(): void {
    const events = this.termine.map(termin => ({
      id: termin.id?.toString(),
      title: termin.status === 'frei' ? 'Verfügbar' : `${termin.patient_name || 'Gebucht'}`,
      start: `${termin.datum}T${termin.uhrzeit}`,
      end: this.calculateEndTime(termin.datum, termin.uhrzeit, termin.dauer_minuten),
      extendedProps: {
        beschreibung: termin.beschreibung,
        status: termin.status
      }
    }));
    
    this.calendarOptions.events = events;
  }
  
  calculateEndTime(date: string, time: string, durationMinutes: number): string {
    const dateTime = new Date(`${date}T${time}`);
    dateTime.setMinutes(dateTime.getMinutes() + durationMinutes);
    return dateTime.toISOString();
  }
  
  handleDateSelect(selectInfo: any): void {
    const startDate = selectInfo.startStr.split('T')[0]; // Nur das Datum
    const startTime = selectInfo.startStr.split('T')[1] || '09:00:00';
    
    const dialogRef = this.dialog.open(TerminDialogComponent, {
      width: '500px',
      data: {
        mode: 'create',
        datum: startDate,
        uhrzeit: startTime.substring(0, 5)
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.termineService.createTermin(result).subscribe({
          next: () => {
            this.loadTermine();
            this.snackBar.open('Termin erfolgreich erstellt!', 'OK', { duration: 3000 });
          },
          error: (error) => {
            console.error('Fehler beim Erstellen des Termins', error);
            this.snackBar.open('Termin konnte nicht erstellt werden.', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }
  
  handleEventClick(clickInfo: any): void {
    const terminId = parseInt(clickInfo.event.id, 10);
    const status = clickInfo.event.extendedProps['status'];
    
    if (status === 'gebucht') {
      this.snackBar.open('Dieser Termin ist bereits gebucht.', 'OK', { duration: 3000 });
      return;
    }
    
    this.termineService.getTermin(terminId).subscribe({
      next: (termin) => {
        if (termin.status === 'frei') {
          const dialogRef = this.dialog.open(BuchungsFormularComponent, {
            width: '500px',
            data: { terminId }
          });
          
          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.termineService.buchungReservieren(result).subscribe({
                next: () => {
                  this.loadTermine();
                  this.snackBar.open('Termin erfolgreich gebucht!', 'OK', { duration: 3000 });
                },
                error: (error) => {
                  console.error('Fehler bei der Buchung', error);
                  this.snackBar.open('Der Termin konnte nicht gebucht werden.', 'OK', { duration: 3000 });
                }
              });
            }
          });
        } else {
          // Bereits gebuchte Termine können nicht ausgewählt werden
          this.snackBar.open('Dieser Termin ist bereits vergeben.', 'OK', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Fehler beim Laden des Termins', error);
      }
    });
  }
}
