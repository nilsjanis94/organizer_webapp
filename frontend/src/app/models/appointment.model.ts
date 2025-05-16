export interface Appointment {
  id?: number;
  title: string;
  description?: string;
  date: string; // ISO-Format: YYYY-MM-DD
  start_time: string; // Format: HH:MM
  duration: number; // Dauer in Minuten
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  status: 'free' | 'booked'; // Status: frei oder gebucht
}

export interface AppointmentDTO {
  id?: number;
  title: string;
  description: string;
  date: string;
  start_time: string;
  duration: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  status: string;
}

export interface AppointmentBookingRequest {
  appointment_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
} 