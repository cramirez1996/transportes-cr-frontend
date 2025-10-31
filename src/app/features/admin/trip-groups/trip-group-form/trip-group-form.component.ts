import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TripGroupService } from '../../../../core/services/trip-group.service';
import { TripGroupStatus } from '../../../../core/models/trip-group.model';

@Component({
  selector: 'app-trip-group-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './trip-group-form.component.html',
  styleUrl: './trip-group-form.component.scss'
})
export class TripGroupFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  tripGroupId: string | null = null;
  isSubmitting = false;
  TripGroupStatus = TripGroupStatus;

  constructor(
    private fb: FormBuilder,
    private tripGroupService: TripGroupService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      description: [''],
      startDate: ['', Validators.required],
      endDate: [''],
      status: [TripGroupStatus.PENDING],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.tripGroupId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.tripGroupId;

    if (this.isEditMode && this.tripGroupId) {
      this.loadTripGroup(this.tripGroupId);
    }
  }

  loadTripGroup(id: string): void {
    this.tripGroupService.getById(id).subscribe({
      next: (tripGroup) => {
        this.form.patchValue({
          description: tripGroup.description,
          startDate: this.formatDateForInput(tripGroup.startDate),
          endDate: tripGroup.endDate ? this.formatDateForInput(tripGroup.endDate) : '',
          status: tripGroup.status,
          notes: tripGroup.notes
        });
      },
      error: (error) => {
        console.error('Error loading trip group:', error);
        alert('Error al cargar la vuelta');
        this.router.navigate(['/admin/trip-groups']);
      }
    });
  }

  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.controls[key].markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = this.form.value;

    if (this.isEditMode && this.tripGroupId) {
      this.tripGroupService.update(this.tripGroupId, formData).subscribe({
        next: () => {
          this.router.navigate(['/admin/trip-groups']);
        },
        error: (error) => {
          console.error('Error updating trip group:', error);
          alert('Error al actualizar la vuelta');
          this.isSubmitting = false;
        }
      });
    } else {
      this.tripGroupService.create(formData).subscribe({
        next: () => {
          this.router.navigate(['/admin/trip-groups']);
        },
        error: (error) => {
          console.error('Error creating trip group:', error);
          alert('Error al crear la vuelta');
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/trip-groups']);
  }
}
