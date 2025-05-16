import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Termin } from '../../services/termine.service';

@Component({
  selector: 'app-termin-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './termin-dialog.component.html',
  styleUrl: './termin-dialog.component.scss'
})
export class TerminDialogComponent {
  terminForm: FormGroup;
  mode: 'create' | 'edit';
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TerminDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.mode = data.mode || 'create';
    
    this.terminForm = this.fb.group({
      titel: ['Freier Termin', Validators.required],
      beschreibung: [''],
      datum: [data.datum || this.formatDate(new Date()), Validators.required],
      uhrzeit: [data.uhrzeit || '09:00', Validators.required],
      dauer_minuten: [30, [Validators.required, Validators.min(15)]],
      status: ['frei']
    });
    
    if (this.mode === 'edit' && data.termin) {
      this.terminForm.patchValue(data.termin);
    }
  }
  
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  onSubmit(): void {
    if (this.terminForm.valid) {
      this.dialogRef.close(this.terminForm.value);
    }
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
}
