import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomSelectComponent, CustomSelectOption } from '../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-custom-select-demo',
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent],
  templateUrl: './custom-select-demo.component.html',
  styleUrl: './custom-select-demo.component.scss'
})
export class CustomSelectDemoComponent implements OnInit {
  demoForm: FormGroup;

  // Simple options
  statusOptions: CustomSelectOption[] = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'pending', label: 'Pendiente' },
  ];

  // Customer options with avatar
  customerOptions: CustomSelectOption[] = [
    {
      value: '1',
      label: 'Transportes ABC Ltda.',
      data: {
        rut: '76.123.456-7',
        email: 'contacto@transportesabc.cl',
        avatar: 'TA'
      }
    },
    {
      value: '2',
      label: 'Logística del Sur S.A.',
      data: {
        rut: '77.234.567-8',
        email: 'ventas@logisticasur.cl',
        avatar: 'LS'
      }
    },
    {
      value: '3',
      label: 'Comercial Ramírez Hermanos',
      data: {
        rut: '78.345.678-9',
        email: 'info@ramirez.cl',
        avatar: 'RH'
      }
    },
    {
      value: '4',
      label: 'Distribuidora El Roble',
      data: {
        rut: '79.456.789-0',
        email: 'contacto@elroble.cl',
        avatar: 'ER'
      }
    },
  ];

  // Vehicle options
  vehicleOptions: CustomSelectOption[] = [
    {
      value: '1',
      label: 'Mercedes-Benz Actros',
      data: {
        plate: 'ABCD-12',
        year: 2022,
        type: 'Camión'
      }
    },
    {
      value: '2',
      label: 'Volvo FH16',
      data: {
        plate: 'EFGH-34',
        year: 2021,
        type: 'Camión'
      }
    },
    {
      value: '3',
      label: 'Ford F-150',
      data: {
        plate: 'IJKL-56',
        year: 2023,
        type: 'Camioneta'
      }
    },
  ];

  // Status with badges
  tripStatusOptions: CustomSelectOption[] = [
    {
      value: 'completed',
      label: 'Completado',
      data: { color: 'green', icon: '✓' }
    },
    {
      value: 'in_progress',
      label: 'En Progreso',
      data: { color: 'blue', icon: '⟳' }
    },
    {
      value: 'pending',
      label: 'Pendiente',
      data: { color: 'yellow', icon: '⏱' }
    },
    {
      value: 'cancelled',
      label: 'Cancelado',
      data: { color: 'red', icon: '✕' }
    },
  ];

  constructor(private fb: FormBuilder) {
    this.demoForm = this.fb.group({
      status: ['', Validators.required],
      customer: ['', Validators.required],
      vehicle: [''],
      tripStatus: ['pending'],
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.demoForm.valid) {
      console.log('Form submitted:', this.demoForm.value);
      alert('Form válido! Ver consola para valores.');
    } else {
      alert('Por favor complete todos los campos requeridos');
    }
  }

  resetForm(): void {
    this.demoForm.reset();
  }
}
