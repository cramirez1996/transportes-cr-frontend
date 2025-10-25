import { Component, ContentChild, TemplateRef, HostListener, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent {
  @Input() align: 'left' | 'right' = 'left';
  @Input() menuWidth: string = '14rem'; // Default w-56 (224px / 16 = 14rem)

  @ContentChild('trigger', { read: TemplateRef }) triggerTemplate!: TemplateRef<any>;
  @ContentChild('menu', { read: TemplateRef }) menuTemplate!: TemplateRef<any>;
  @ViewChild('dropdownContainer', { read: ElementRef }) dropdownContainer!: ElementRef;

  isOpen = false;
  menuPosition = { top: 0, left: 0 };

  constructor(private elementRef: ElementRef) {}

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.calculateMenuPosition();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  private calculateMenuPosition(): void {
    setTimeout(() => {
      const triggerElement = this.elementRef.nativeElement.querySelector('div > div');
      if (triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        const menuWidthPx = parseFloat(this.menuWidth) * 16; // Convert rem to px

        this.menuPosition = {
          top: rect.bottom + window.scrollY + 8, // 8px = mt-2
          left: this.align === 'right'
            ? rect.right + window.scrollX - menuWidthPx
            : rect.left + window.scrollX
        };
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close dropdown if click is outside
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeDropdown();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowChange(): void {
    if (this.isOpen) {
      this.calculateMenuPosition();
    }
  }
}
