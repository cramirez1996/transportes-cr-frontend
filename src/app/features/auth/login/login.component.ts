import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/enums/user-role.enum';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading.set(false);

        // Redirect based on role
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          // Determinar redirección basada en rol del usuario
          const userRole = response.user.role.name;

          if (userRole === UserRole.ADMIN || userRole === UserRole.STAFF || userRole === UserRole.SUPER_ADMIN) {
            this.router.navigate(['/admin/dashboard']);
          } else if (userRole === UserRole.CUSTOMER) {
            this.router.navigate(['/portal/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      }
    });
  }

  // Helper for demo
  fillDemo(role: 'admin' | 'customer'): void {
    if (role === 'admin') {
      this.loginForm.patchValue({
        email: 'admin@transportes.cl',
        password: 'password123'
      });
    } else {
      this.loginForm.patchValue({
        email: 'customer@example.cl',
        password: 'password123'
      });
    }
  }
}
