import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TermineService } from '../../services/termine.service';

@Component({
  selector: 'app-buchungs-formular',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './buchungs-formular.component.html',
  styleUrl: './buchungs-formular.component.scss'
})
export class BuchungsFormularComponent {
  buchungsForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private termineService: TermineService,
    private dialogRef: MatDialogRef<BuchungsFormularComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {terminId: number}
  ) {
    this.buchungsForm = this.fb.group({
      patient_name: ['', Validators.required],
      patient_email: ['', [Validators.required, Validators.email]],
      patient_telefon: [''],
      beschreibung: ['']
    });
  }
  
  onSubmit(): void {
    if (this.buchungsForm.valid) {
      this.termineService.getTermin(this.data.terminId).subscribe(termin => {
        const buchungsData = {
          ...termin,
          ...this.buchungsForm.value,
          status: 'gebucht'
        };
        this.dialogRef.close(buchungsData);
      });
    }
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
}
