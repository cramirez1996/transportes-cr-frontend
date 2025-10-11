import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatRut, cleanRut } from '../validators/rut.validator';

/**
 * Directiva para formatear automáticamente el RUT mientras el usuario escribe
 * Uso: <input type="text" formControlName="rut" appRutFormat />
 */
@Directive({
  selector: '[appRutFormat]',
  standalone: true
})
export class RutFormatDirective {
  private el = inject(ElementRef);
  private ngControl = inject(NgControl, { optional: true });

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Eliminar todos los caracteres que no sean números o K/k
    value = value.replace(/[^0-9kK]/g, '');

    // Limitar longitud máxima (8 dígitos + 1 verificador)
    if (value.length > 9) {
      value = value.slice(0, 9);
    }

    // Formatear el RUT
    const formattedValue = formatRut(value, false);

    // Actualizar el valor del input y del control del formulario
    input.value = formattedValue;

    if (this.ngControl && this.ngControl.control) {
      // Guardar la posición del cursor
      const cursorPosition = input.selectionStart || 0;

      // Actualizar el valor del formulario sin formato para la validación
      this.ngControl.control.setValue(formattedValue, { emitEvent: false });

      // Restaurar la posición del cursor ajustada
      setTimeout(() => {
        input.setSelectionRange(cursorPosition, cursorPosition);
      });
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    if (value) {
      // Al perder el foco, asegurar que el formato sea correcto
      const cleaned = cleanRut(value);
      const formatted = formatRut(cleaned, false);
      input.value = formatted;

      if (this.ngControl && this.ngControl.control) {
        this.ngControl.control.setValue(formatted, { emitEvent: false });
      }
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';

    // Limpiar y formatear el texto pegado
    const cleaned = cleanRut(pastedText);
    const formatted = formatRut(cleaned, false);

    const input = this.el.nativeElement as HTMLInputElement;
    input.value = formatted;

    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(formatted);
    }
  }
}
