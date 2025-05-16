import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { Appointment, AppointmentBookingRequest, AppointmentDTO } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly apiUrl = 'http://localhost:8000/api';
  appointments = signal<Appointment[]>([]);

  constructor(private http: HttpClient) { }

  // Termine vom Backend laden
  getAppointments(): Observable<Appointment[]> {
    return this.http.get<any[]>(`${this.apiUrl}/termine/`).pipe(
      map(data => data.map(this.convertFromBackend)),
      tap(appointments => this.appointments.set(appointments))
    );
  }

  // Einzelnen Termin laden
  getAppointment(id: number): Observable<Appointment> {
    return this.http.get<any>(`${this.apiUrl}/termine/${id}/`).pipe(
      map(this.convertFromBackend)
    );
  }

  // Freie Termine laden
  getFreeAppointments(): Observable<Appointment[]> {
    return this.http.get<any[]>(`${this.apiUrl}/termine/verfuegbar/`).pipe(
      map(data => data.map(this.convertFromBackend))
    );
  }

  // Termine eines bestimmten Benutzers laden
  getUserAppointments(email: string): Observable<Appointment[]> {
    // URL-Encoding für die E-Mail-Adresse, da sie Sonderzeichen enthält
    const encodedEmail = encodeURIComponent(email);
    console.log(`Lade Termine für Benutzer ${email}, encodierte E-Mail: ${encodedEmail}`);
    
    // Angenommen, das Backend hat einen Endpunkt, um Termine nach Benutzer-Email zu filtern
    return this.http.get<any[]>(`${this.apiUrl}/termine/benutzer/${encodedEmail}/`).pipe(
      map(data => data.map(this.convertFromBackend)),
      tap(userAppointments => {
        console.log(`${userAppointments.length} Termine für Benutzer ${email} geladen`);
      })
    );
  }

  // Neuen Termin erstellen
  createAppointment(appointment: Appointment): Observable<Appointment> {
    const backendData = this.convertToBackend(appointment);
    return this.http.post<any>(`${this.apiUrl}/termine/`, backendData).pipe(
      map(this.convertFromBackend),
      tap(newAppointment => {
        this.appointments.update(appointments => [...appointments, newAppointment]);
      })
    );
  }

  // Termin buchen
  bookAppointment(bookingRequest: AppointmentBookingRequest): Observable<Appointment> {
    const backendData = {
      patient_name: bookingRequest.patient_name,
      patient_email: bookingRequest.patient_email,
      patient_phone: bookingRequest.patient_phone
    };
    
    return this.http.post<any>(
      `${this.apiUrl}/termine/${bookingRequest.appointment_id}/buchen/`, 
      backendData
    ).pipe(
      map(this.convertFromBackend),
      tap(bookedAppointment => {
        this.appointments.update(appointments => 
          appointments.map(app => app.id === bookedAppointment.id ? bookedAppointment : app)
        );
      })
    );
  }

  // Termin aktualisieren
  updateAppointment(id: number, appointment: Appointment): Observable<Appointment> {
    const backendData = this.convertToBackend(appointment);
    return this.http.put<any>(`${this.apiUrl}/termine/${id}/`, backendData).pipe(
      map(this.convertFromBackend),
      tap(updatedAppointment => {
        this.appointments.update(appointments => 
          appointments.map(app => app.id === id ? updatedAppointment : app)
        );
      })
    );
  }

  // Termin löschen
  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/termine/${id}/`).pipe(
      tap(() => {
        this.appointments.update(appointments => 
          appointments.filter(app => app.id !== id)
        );
      })
    );
  }

  // Backend-Format in Appointment umwandeln
  private convertFromBackend(backendData: any): Appointment {
    return {
      id: backendData.id,
      title: backendData.titel,
      description: backendData.beschreibung || '',
      date: backendData.datum,
      start_time: backendData.uhrzeit.substring(0, 5),
      duration: backendData.dauer_minuten,
      patient_name: backendData.patient_name || '',
      patient_email: backendData.patient_email || '',
      patient_phone: backendData.patient_telefon || '',
      status: backendData.status === 'gebucht' ? 'booked' : 'free'
    };
  }

  // Appointment in Backend-Format umwandeln
  private convertToBackend(appointment: Appointment): any {
    return {
      titel: appointment.title,
      beschreibung: appointment.description || '',
      datum: appointment.date,
      uhrzeit: appointment.start_time,
      dauer_minuten: appointment.duration,
      patient_name: appointment.patient_name || null,
      patient_email: appointment.patient_email || null,
      patient_telefon: appointment.patient_phone || null,
      status: appointment.status === 'booked' ? 'gebucht' : 'frei'
    };
  }

  // Termin in Kalenderereignis umwandeln
  convertToCalendarEvent(appointment: Appointment) {
    // Datum und Uhrzeit kombinieren
    const startDate = `${appointment.date}T${appointment.start_time}:00`;
    
    // Endzeit berechnen
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + appointment.duration);
    
    return {
      id: appointment.id?.toString(),
      title: appointment.title,
      start: startDate,
      end: endDate.toISOString(),
      extendedProps: {
        description: appointment.description,
        status: appointment.status,
        patient: appointment.patient_name
      },
      backgroundColor: appointment.status === 'free' ? '#4CAF50' : '#F44336',
      borderColor: appointment.status === 'free' ? '#388E3C' : '#D32F2F',
      textColor: '#FFFFFF'
    };
  }
}
