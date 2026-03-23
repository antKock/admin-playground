import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowUpRight } from 'lucide-angular';
import { formatDateFr } from '@app/shared/utils/format-date';

export interface MetadataField {
  label: string;
  value: string;
  type?: 'text' | 'mono' | 'linked' | 'date' | 'status';
  linkedRoute?: string;
}

@Component({
  selector: 'app-metadata-grid',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './metadata-grid.component.html',
  styleUrl: './metadata-grid.component.css',
})
export class MetadataGridComponent {
  readonly fields = input.required<MetadataField[]>();
  readonly ArrowUpRight = ArrowUpRight;

  formatDate(value: string): string {
    return formatDateFr(value);
  }
}
