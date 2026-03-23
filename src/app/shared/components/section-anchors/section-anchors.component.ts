import { Component, input, output, signal, OnInit, OnDestroy, effect } from '@angular/core';

export interface SectionDef {
  label: string;
  count?: number;
  targetId: string;
}

@Component({
  selector: 'app-section-anchors',
  templateUrl: './section-anchors.component.html',
  styleUrl: './section-anchors.component.css',
})
export class SectionAnchorsComponent implements OnInit, OnDestroy {
  readonly sections = input.required<SectionDef[]>();
  readonly activeSection = input<string>('');
  readonly anchorClicked = output<string>();

  readonly currentActiveSection = signal<string>('');

  private observer: IntersectionObserver | null = null;
  private observedElements: Element[] = [];

  constructor() {
    effect(() => {
      const external = this.activeSection();
      if (external) {
        this.currentActiveSection.set(external);
      }
    });

    effect(() => {
      const sectionList = this.sections();
      if (sectionList.length > 0) {
        this.setupObserver(sectionList);
      }
    });
  }

  ngOnInit(): void {
    const sectionList = this.sections();
    if (sectionList.length > 0) {
      this.currentActiveSection.set(sectionList[0].targetId);
    }
  }

  ngOnDestroy(): void {
    this.cleanupObserver();
  }

  scrollTo(targetId: string): void {
    this.anchorClicked.emit(targetId);
    this.currentActiveSection.set(targetId);
    const el = document.getElementById(targetId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private setupObserver(sectionList: SectionDef[]): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.cleanupObserver();

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.currentActiveSection.set(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 },
    );

    for (const section of sectionList) {
      const el = document.getElementById(section.targetId);
      if (el) {
        this.observer.observe(el);
        this.observedElements.push(el);
      }
    }
  }

  private cleanupObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.observedElements = [];
  }
}
