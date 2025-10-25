import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="'inline-flex items-center justify-center rounded-full font-semibold text-white ' + sizeClasses"
      [style.background-color]="backgroundColor">
      {{ initials }}
    </div>
  `,
  styles: []
})
export class AvatarComponent {
  @Input() name: string = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() imageUrl?: string;

  get initials(): string {
    if (!this.name) return '?';

    const words = this.name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  get backgroundColor(): string {
    // Generate a consistent color based on name
    const colors = [
      '#3B82F6', // blue-500
      '#10B981', // green-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#06B6D4', // cyan-500
      '#F97316', // orange-500
    ];

    const hash = this.name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  }

  get sizeClasses(): string {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl'
    };
    return sizes[this.size];
  }
}
