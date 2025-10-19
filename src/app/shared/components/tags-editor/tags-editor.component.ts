import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TagEntry {
  key: string;
  value: string;
}

@Component({
  selector: 'app-tags-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tags-editor.component.html',
  styleUrl: './tags-editor.component.scss'
})
export class TagsEditorComponent implements OnInit {
  @Input() tags: Record<string, any> = {};
  @Input() placeholder: string = 'Tags personalizados';
  @Input() disabled: boolean = false;
  @Output() tagsChange = new EventEmitter<Record<string, any>>();

  entries: TagEntry[] = [];

  ngOnInit(): void {
    this.loadEntries();
  }

  ngOnChanges(): void {
    this.loadEntries();
  }

  private loadEntries(): void {
    if (this.tags && typeof this.tags === 'object') {
      this.entries = Object.entries(this.tags).map(([key, value]) => ({
        key,
        value: String(value)
      }));
    } else {
      this.entries = [];
    }

    // Always have at least one empty row
    if (this.entries.length === 0) {
      this.entries.push({ key: '', value: '' });
    }
  }

  addEntry(): void {
    this.entries.push({ key: '', value: '' });
  }

  removeEntry(index: number): void {
    this.entries.splice(index, 1);

    // Ensure at least one row remains
    if (this.entries.length === 0) {
      this.entries.push({ key: '', value: '' });
    }

    this.emitChanges();
  }

  onEntryChange(): void {
    this.emitChanges();
  }

  private emitChanges(): void {
    const tagsObject: Record<string, any> = {};

    this.entries.forEach(entry => {
      if (entry.key && entry.key.trim()) {
        tagsObject[entry.key.trim()] = entry.value || '';
      }
    });

    this.tagsChange.emit(tagsObject);
  }

  trackByIndex(index: number): number {
    return index;
  }

  hasValidEntries(): boolean {
    return this.entries.some(e => e.key && e.key.trim());
  }
}
