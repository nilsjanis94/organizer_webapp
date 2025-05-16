import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { Appointment } from '../../models/appointment.model';

@Component({
  selector: 'app-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule
  ],
  templateUrl: './appointment-dialog.component.html',
  styleUrl: './appointment-dialog.component.scss'
})
export class AppointmentDialogComponent {
  appointmentForm: FormGroup;
  dialogTitle: string;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { appointment?: Appointment, mode: 'create' | 'edit' | 'view' }
  ) {
    this.isEditMode = data.mode === 'edit' || data.mode === 'create';
    this.dialogTitle = data.mode === 'create' ? 'Neuen Termin erstellen' : 
                      data.mode === 'edit' ? 'Termin bearbeiten' : 'Termin-Details';

    this.appointmentForm = this.fb.group({
      title: [data.appointment?.title || '', [Validators.required]],
      description: [data.appointment?.description || ''],
      date: [data.appointment?.date ? new Date(data.appointment.date) : new Date(), [Validators.required]],
      start_time: [data.appointment?.start_time || '09:00', [Validators.required, Validators.pattern('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      duration: [data.appointment?.duration || 30, [Validators.required, Validators.min(15), Validators.max(240)]],
      status: [data.appointment?.status || 'free']
    });

    // In der View-Mode, das Formular deaktivieren
    if (data.mode === 'view') {
      this.appointmentForm.disable();
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.valid) {
      const formValue = this.appointmentForm.value;
      
      // Datum in ISO-String formatieren (YYYY-MM-DD)
      const date = formValue.date instanceof Date ? 
        formValue.date.toISOString().split('T')[0] : 
        formValue.date;

      const appointment: Appointment = {
        ...this.data.appointment,
        title: formValue.title,
        description: formValue.description,
        date,
        start_time: formValue.start_time,
        duration: formValue.duration,
        status: formValue.status
      };

      this.dialogRef.close(appointment);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
