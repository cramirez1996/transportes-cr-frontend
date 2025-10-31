import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionExplorerService } from '../../../../../../core/services/transaction-explorer.service';
import {
  SearchEntityType,
  SearchResultItem,
  SearchResult,
} from '../../../../../../core/models/transaction-explorer.model';

@Component({
  selector: 'app-entity-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entity-multi-select.component.html',
  styleUrl: './entity-multi-select.component.scss',
})
export class EntityMultiSelectComponent implements OnInit {
  @Input() entityType!: SearchEntityType;
  @Input() label: string = 'Seleccionar';
  @Input() placeholder: string = 'Buscar...';
  @Input() selectedIds: string[] = [];
  @Output() selectedIdsChange = new EventEmitter<string[]>();

  searchQuery: string = '';
  availableItems: SearchResultItem[] = [];
  selectedItems: SearchResultItem[] = [];
  isLoading: boolean = false;
  isDropdownOpen: boolean = false;

  constructor(private transactionExplorerService: TransactionExplorerService) {}

  ngOnInit(): void {
    this.loadItems();
    this.loadSelectedItems();
  }

  loadItems(): void {
    this.isLoading = true;
    this.transactionExplorerService
      .search({
        entity: this.entityType,
        q: this.searchQuery,
        limit: 20,
      })
      .subscribe({
        next: (result: SearchResult) => {
          this.availableItems = result.items;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading items:', error);
          this.isLoading = false;
        },
      });
  }

  loadSelectedItems(): void {
    if (this.selectedIds.length === 0) {
      this.selectedItems = [];
      return;
    }

    // Load full item data for selected IDs
    this.transactionExplorerService
      .search({
        entity: this.entityType,
        limit: 50,
      })
      .subscribe({
        next: (result: SearchResult) => {
          this.selectedItems = result.items.filter((item: SearchResultItem) =>
            this.selectedIds.includes(item.id)
          );
        },
      });
  }

  onSearchChange(): void {
    this.loadItems();
  }

  toggleItem(item: SearchResultItem): void {
    const index = this.selectedIds.indexOf(item.id);
    if (index > -1) {
      // Remove
      this.selectedIds.splice(index, 1);
      this.selectedItems = this.selectedItems.filter((i) => i.id !== item.id);
    } else {
      // Add
      this.selectedIds.push(item.id);
      this.selectedItems.push(item);
    }
    this.selectedIdsChange.emit(this.selectedIds);
  }

  removeItem(item: SearchResultItem): void {
    const index = this.selectedIds.indexOf(item.id);
    if (index > -1) {
      this.selectedIds.splice(index, 1);
      this.selectedItems = this.selectedItems.filter((i) => i.id !== item.id);
      this.selectedIdsChange.emit(this.selectedIds);
    }
  }

  isSelected(item: SearchResultItem): boolean {
    return this.selectedIds.includes(item.id);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.loadItems();
    }
  }

  clearAll(): void {
    this.selectedIds = [];
    this.selectedItems = [];
    this.selectedIdsChange.emit(this.selectedIds);
  }
}
