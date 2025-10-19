import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-month-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './month-picker.component.html',
  styleUrl: './month-picker.component.scss'
})
export class MonthPickerComponent {
  @Input() label: string = 'Seleccionar Mes';
  @Input() selectedMonth: string = this.getCurrentMonthISO();
  @Output() monthChange = new EventEmitter<string>();

  months: { value: string; label: string }[] = [];

  constructor() {
    this.generateMonthOptions();
  }

  private generateMonthOptions(): void {
    const currentDate = new Date();
    const options: { value: string; label: string }[] = [];

    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate);
      date.setMonth(currentDate.getMonth() - i);
      date.setDate(1); // Set to first day of month

      const value = this.formatMonthISO(date);
      const label = this.formatMonthDisplay(date);

      options.push({ value, label });
    }

    this.months = options;
  }

  onMonthChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedMonth = target.value;
    this.monthChange.emit(this.selectedMonth);
  }

  private getCurrentMonthISO(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private formatMonthISO(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private formatMonthDisplay(date: Date): string {
    return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  }
}
