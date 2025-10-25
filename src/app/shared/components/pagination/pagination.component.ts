import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
  @Input() page: number = 1;
  @Input() limit: number = 10;
  @Input() total: number = 0;
  @Input() totalPages: number = 0;
  @Input() showLimitSelector: boolean = true;
  @Input() limitOptions: number[] = [10, 25, 50, 100];
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() limitChange = new EventEmitter<number>();

  get visiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const currentPage = Number(this.page);
    const totalPages = Number(this.totalPages);

    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show first page
    pages.push(1);

    // Determine the range to show
    let startPage: number;
    let endPage: number;

    if (currentPage <= 3) {
      // Near the start: show 2, 3, 4, 5
      startPage = 2;
      endPage = 5;
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      pages.push('...');
    } else if (currentPage >= totalPages - 2) {
      // Near the end: show last 4 pages before last
      pages.push('...');
      startPage = totalPages - 4;
      endPage = totalPages - 1;
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    } else {
      // In the middle: show current page with one on each side
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
    }

    // Always show last page
    pages.push(totalPages);

    return pages;
  }

  onPageClick(page: number): void {
    // Solo emitir si la página es diferente a la actual
    // Usar == para comparar valores sin importar el tipo
    if (page != this.page) {
      this.pageChange.emit(page);
    }
  }

  goToPreviousPage(): void {
    if (this.page > 1) {
      this.pageChange.emit(Number(this.page) - 1);
    }
  }

  goToNextPage(): void {
    if (this.page < this.totalPages) {
      this.pageChange.emit(Number(this.page) + 1);
    }
  }

  onLimitChangeInternal(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newLimit = Number(selectElement.value);
    this.limitChange.emit(newLimit);
  }
}
