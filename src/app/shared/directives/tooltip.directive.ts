import { Directive, ElementRef, HostListener, inject, input, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  readonly appTooltip = input<string>('');
  readonly tooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('top');

  private readonly el = inject(ElementRef);
  private tooltipElement: HTMLDivElement | null = null;

  @HostListener('mouseenter')
  @HostListener('focus')
  onShow(): void {
    const text = this.appTooltip();
    if (!text) return;

    this.removeTooltip();
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.textContent = text;
    this.tooltipElement.setAttribute('role', 'tooltip');
    this.tooltipElement.id = `tooltip-${Math.random().toString(36).slice(2, 9)}`;
    Object.assign(this.tooltipElement.style, {
      position: 'absolute',
      background: '#333',
      color: '#fff',
      fontSize: '12px',
      fontWeight: '500',
      padding: '4px 8px',
      borderRadius: '4px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: '1000',
    });

    this.el.nativeElement.setAttribute('aria-describedby', this.tooltipElement.id);
    document.body.appendChild(this.tooltipElement);
    this.positionTooltip();
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  @HostListener('keydown.escape')
  onHide(): void {
    this.removeTooltip();
  }

  ngOnDestroy(): void {
    this.removeTooltip();
  }

  private positionTooltip(): void {
    if (!this.tooltipElement) return;

    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const gap = 6;

    let top: number;
    let left: number;

    switch (this.tooltipPosition()) {
      case 'bottom':
        top = hostRect.bottom + gap + scrollY;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2 + scrollX;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2 + scrollY;
        left = hostRect.left - tooltipRect.width - gap + scrollX;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2 + scrollY;
        left = hostRect.right + gap + scrollX;
        break;
      case 'top':
      default:
        top = hostRect.top - tooltipRect.height - gap + scrollY;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2 + scrollX;
        break;
    }

    // Clamp to viewport boundaries
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    left = Math.max(scrollX + 4, Math.min(left, scrollX + vw - tooltipRect.width - 4));
    top = Math.max(scrollY + 4, Math.min(top, scrollY + vh - tooltipRect.height - 4));

    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
  }

  private removeTooltip(): void {
    if (this.tooltipElement) {
      this.el.nativeElement.removeAttribute('aria-describedby');
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
  }
}
