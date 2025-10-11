import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Valida que un RUT chileno sea válido según el algoritmo módulo 11
 */
export function rutValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // No validar si está vacío (usar Validators.required para eso)
    }

    const rut = control.value.toString().replace(/\./g, '').replace(/-/g, '');

    // Verificar formato básico
    if (!/^\d{7,8}[\dkK]$/.test(rut)) {
      return { invalidRut: true };
    }

    // Separar número y dígito verificador
    const rutNumber = rut.slice(0, -1);
    const verifier = rut.slice(-1).toLowerCase();

    // Calcular dígito verificador esperado
    let sum = 0;
    let multiplier = 2;

    for (let i = rutNumber.length - 1; i >= 0; i--) {
      sum += parseInt(rutNumber[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedVerifier = 11 - (sum % 11);
    let calculatedVerifier: string;

    if (expectedVerifier === 11) {
      calculatedVerifier = '0';
    } else if (expectedVerifier === 10) {
      calculatedVerifier = 'k';
    } else {
      calculatedVerifier = expectedVerifier.toString();
    }

    // Comparar dígito verificador
    if (verifier !== calculatedVerifier) {
      return { invalidRut: true };
    }

    return null;
  };
}

/**
 * Formatea un RUT chileno agregando puntos y guión
 * Ejemplo: 12345678-9 o 12.345.678-9
 */
export function formatRut(rut: string, includeThousandsSeparator: boolean = false): string {
  // Eliminar caracteres no numéricos excepto K
  const clean = rut.replace(/[^0-9kK]/g, '');

  if (clean.length < 2) {
    return clean;
  }

  // Separar número y dígito verificador
  const number = clean.slice(0, -1);
  const verifier = clean.slice(-1);

  if (includeThousandsSeparator) {
    // Agregar puntos de miles
    const formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedNumber}-${verifier}`;
  }

  return `${number}-${verifier}`;
}

/**
 * Limpia el formato de un RUT, dejando solo números y el dígito verificador
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '');
}

/**
 * Normaliza un RUT al formato: 12345678-9 (sin puntos, con guión)
 * Esto asegura almacenamiento consistente y previene duplicados
 */
export function normalizeRut(rut: string): string {
  if (!rut) {
    return '';
  }

  // Eliminar todos los caracteres no numéricos excepto K
  const clean = rut.replace(/[^0-9kK]/g, '');

  if (clean.length < 2) {
    return clean;
  }

  // Separar número y dígito verificador
  const number = clean.slice(0, -1);
  const verifier = clean.slice(-1).toUpperCase();

  // Retornar formato normalizado: número-verificador
  return `${number}-${verifier}`;
}
