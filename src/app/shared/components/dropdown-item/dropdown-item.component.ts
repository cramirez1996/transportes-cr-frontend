import { Component, Input, HostListener, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dropdown-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dropdown-item.component.html',
  styleUrls: ['./dropdown-item.component.scss'],
  host: {
    'class': 'block'
  }
})
export class DropdownItemComponent {
  @Input() type: 'button' | 'link' = 'button';
  @Input() routerLink?: string | any[];
  @Input() variant: 'default' | 'danger' | 'warning' = 'default';
  @Input() disabled: boolean = false;

  @Output() itemClick = new EventEmitter<void>();

  @HostBinding('class')
  get hostClass(): string {
    return 'block';
  }

  get itemClass(): string {
    const baseClass = 'flex items-center w-full px-4 py-2 text-sm transition-colors text-left';

    if (this.disabled) {
      return `${baseClass} text-gray-400 cursor-not-allowed`;
    }

    switch (this.variant) {
      case 'danger':
        return `${baseClass} text-red-600 hover:bg-red-50 hover:text-red-700`;
      case 'warning':
        return `${baseClass} text-orange-600 hover:bg-orange-50 hover:text-orange-700`;
      default:
        return `${baseClass} text-gray-700 hover:bg-gray-50 hover:text-gray-900`;
    }
  }

  onClick(): void {
    if (!this.disabled) {
      this.itemClick.emit();
    }
  }
}
