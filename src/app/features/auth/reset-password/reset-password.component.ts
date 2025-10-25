import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  loading = signal(false);
  validatingToken = signal(true);
  error = signal<string | null>(null);
  success = signal(false);
  tokenValid = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  private token: string | null = null;

  // Password strength indicators
  passwordStrength = signal({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSymbol: false
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });

    // Watch password changes for strength indicator
    this.resetPasswordForm.get('newPassword')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password);
    });
  }

  ngOnInit(): void {
    // Get token from query params
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.error.set('Token no proporcionado');
      this.validatingToken.set(false);
      return;
    }

    // Validate token with backend
    this.authService.validateResetToken(this.token).subscribe({
      next: (response) => {
        this.tokenValid.set(true);
        this.validatingToken.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Token inválido o expirado');
        this.tokenValid.set(false);
        this.validatingToken.set(false);
      }
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  updatePasswordStrength(password: string): void {
    this.passwordStrength.set({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSymbol: /[@$!%*?&]/.test(password)
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || !this.token) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload = {
      token: this.token,
      newPassword: this.resetPasswordForm.value.newPassword
    };

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al restablecer la contraseña');
      }
    });
  }
}
