import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Appointment, AppointmentBookingRequest } from '../../models/appointment.model';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.scss'
})
export class BookingFormComponent implements OnInit, OnChanges {
  @Input() appointment: Appointment | null = null;
  @Output() bookAppointment = new EventEmitter<AppointmentBookingRequest>();
  @Output() cancel = new EventEmitter<void>();

  bookingForm: FormGroup;
  submitted = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.bookingForm = this.createForm();
  }

  ngOnInit(): void {
    this.bookingForm = this.createForm();
    
    // Wenn Benutzer eingeloggt ist, E-Mail automatisch ausfüllen
    const currentUser = this.authService.currentUser();
    if (currentUser && currentUser.email) {
      this.bookingForm.patchValue({
        patient_email: currentUser.email,
        patient_name: currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : ''
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointment'] && this.appointment) {
      this.resetForm();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      patient_name: ['', [Validators.required, Validators.minLength(3)]],
      patient_email: ['', [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      patient_phone: ['', [Validators.required, Validators.pattern('[0-9]{6,}')]]
    });
  }

  resetForm(): void {
    // Formular zurücksetzen aber E-Mail behalten, wenn Benutzer eingeloggt ist
    const currentUser = this.authService.currentUser();
    if (currentUser && currentUser.email) {
      this.bookingForm.reset({
        patient_email: currentUser.email,
        patient_name: currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : ''
      });
    } else {
      this.bookingForm.reset();
    }
    
    this.errorMessage = null;
    this.submitted = false;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;

    if (this.bookingForm.invalid || !this.appointment?.id) {
      this.errorMessage = 'Bitte füllen Sie alle erforderlichen Felder korrekt aus.';
      return;
    }

    const formValue = this.bookingForm.value;
    const bookingRequest: AppointmentBookingRequest = {
      appointment_id: this.appointment.id,
      patient_name: formValue.patient_name,
      patient_email: formValue.patient_email,
      patient_phone: formValue.patient_phone
    };

    console.log('Buchungsanfrage wird gesendet:', bookingRequest);
    this.bookAppointment.emit(bookingRequest);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get formControls() {
    return this.bookingForm.controls;
  }
}
