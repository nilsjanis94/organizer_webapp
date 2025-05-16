import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Termin {
  id?: number;
  titel: string;
  beschreibung?: string;
  datum: string;
  uhrzeit: string;
  dauer_minuten: number;
  patient_name?: string;
  patient_email?: string;
  patient_telefon?: string;
  status: 'frei' | 'gebucht';
  erstellt_am?: string;
  aktualisiert_am?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TermineService {
  private apiUrl = 'http://localhost:8000/api/termine/';

  constructor(private http: HttpClient) { }

  getTermine(): Observable<Termin[]> {
    return this.http.get<Termin[]>(this.apiUrl);
  }

  getVerfuegbareTermine(): Observable<Termin[]> {
    return this.http.get<Termin[]>(`${this.apiUrl}verfuegbar/`);
  }

  getTermin(id: number): Observable<Termin> {
    return this.http.get<Termin>(`${this.apiUrl}${id}/`);
  }

  createTermin(termin: Termin): Observable<Termin> {
    return this.http.post<Termin>(this.apiUrl, termin);
  }

  updateTermin(id: number, termin: Termin): Observable<Termin> {
    return this.http.put<Termin>(`${this.apiUrl}${id}/`, termin);
  }

  deleteTermin(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }
  
  buchungReservieren(termin: Termin): Observable<Termin> {
    const buchungsData = {
      ...termin,
      status: 'gebucht'
    };
    if (termin.id) {
      return this.http.put<Termin>(`${this.apiUrl}${termin.id}/`, buchungsData);
    } else {
      return this.http.post<Termin>(this.apiUrl, buchungsData);
    }
  }
}
