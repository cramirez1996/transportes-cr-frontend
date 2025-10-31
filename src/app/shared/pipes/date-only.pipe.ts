import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para mostrar fechas sin conversión de timezone
 * Útil para campos como accounting_period, issue_date, etc.
 * que representan fechas conceptuales sin hora específica.
 * 
 * Uso:
 * {{ invoice.accountingPeriod | dateOnly:'MM/yyyy' }}
 * {{ invoice.issueDate | dateOnly:'dd/MM/yyyy' }}
 */
@Pipe({
  name: 'dateOnly',
  standalone: true
})
export class DateOnlyPipe implements PipeTransform {
  
  transform(value: string | Date | null | undefined, format: string = 'dd/MM/yyyy'): string {
    if (!value) {
      return '';
    }

    // Convertir a Date si es string
    const date = typeof value === 'string' ? new Date(value) : value;

    // Extraer la parte de fecha en UTC (sin conversión a timezone local)
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    // Aplicar formato
    switch (format) {
      case 'dd/MM/yyyy':
        return `${this.pad(day)}/${this.pad(month)}/${year}`;
      case 'MM/yyyy':
        return `${this.pad(month)}/${year}`;
      case 'yyyy-MM-dd':
        return `${year}-${this.pad(month)}-${this.pad(day)}`;
      case 'dd/MM':
        return `${this.pad(day)}/${this.pad(month)}`;
      default:
        return `${this.pad(day)}/${this.pad(month)}/${year}`;
    }
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }
}
