import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  EMPTY_LAYER,
  OUTCOMES_ACTIVE_GLOW_STOPS,
  OUTCOMES_MASK_GRADIENT_STOPS,
  OUTCOMES_REST_GLOW_STOPS,
  OUTCOMES_WEB_BACK_DOTS,
  OUTCOMES_WEB_BACK_LINES,
  OUTCOMES_WEB_FRONT_DOTS,
  OUTCOMES_WEB_FRONT_LINES,
  OutcomesAriaLabels,
  OutcomesLayerConfig,
  OutcomesLayerKey,
  OutcomesLayerShape,
  OutcomesModelConfig,
} from '../outcomes-model/outcomes-model.config';

// Renders the outer ring diagram (the SVG) for OutcomesModelComponent. Pulled into its
// own component so the large SVG markup and its geometry/color logic don't live inside
// a general-purpose panel component's template and class.
@Component({
  selector: 'app-outcomes-diagram',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './outcomes-diagram.component.html',
  styleUrls: ['./outcomes-diagram.component.scss'],
})
export class OutcomesDiagramComponent {
  @Input() config!: OutcomesModelConfig;
  @Input() selectedLayerKey!: OutcomesLayerKey;
  @Input() hasProgramOutcomeData = false;
  @Input() disabledLayerKeys: Set<OutcomesLayerKey> = new Set();
  @Input() showDiagramNote = true;

  @Output() layerSelect = new EventEmitter<OutcomesLayerKey>();

  private static nextInstanceId = 0;
  readonly instanceId = `outcomes-diagram-${OutcomesDiagramComponent.nextInstanceId++}`;

  readonly webBackLines = OUTCOMES_WEB_BACK_LINES;
  readonly webBackDots = OUTCOMES_WEB_BACK_DOTS;
  readonly webFrontLines = OUTCOMES_WEB_FRONT_LINES;
  readonly webFrontDots = OUTCOMES_WEB_FRONT_DOTS;
  readonly restGlowStops = OUTCOMES_REST_GLOW_STOPS;
  readonly activeGlowStops = OUTCOMES_ACTIVE_GLOW_STOPS;
  readonly maskGradientStops = OUTCOMES_MASK_GRADIENT_STOPS;

  hoveredLayerKey: OutcomesLayerKey | null = null;

  private readonly diagramCenter = 300;
  private readonly cssVarCache = new Map<string, string>();

  get layers(): OutcomesLayerConfig[] {
    return this.config.layers;
  }

  get reversedLayers(): OutcomesLayerConfig[] {
    return [...this.layers].reverse();
  }

  get outerLayer(): OutcomesLayerConfig {
    const sortedByRadius = [...this.layers].sort(
      (a, b) => b.diagram.outerRadius - a.diagram.outerRadius
    );
    return sortedByRadius[0] || this.layers[0] || EMPTY_LAYER;
  }

  get innerLayer(): OutcomesLayerConfig {
    const sortedByInnerRadius = [...this.layers].sort(
      (a, b) => a.diagram.innerRadius - b.diagram.innerRadius
    );
    return sortedByInnerRadius[0] || this.layers[0] || EMPTY_LAYER;
  }

  get outerLayerOpacity(): number {
    return this.isDiagramLayerDisabled(this.outerLayer.key) ? 0.35 : 1;
  }

  get outerGlowFill(): string {
    return this.gradientUrl(this.isOuterLayerAccented ? 'netActive' : 'netRest');
  }

  get webBackColor(): string {
    return this.outerWebColor(this.cssVar('--oc-diagram-grey-light'), this.cssVar('--oc-diagram-grey-lighter'));
  }

  get webFrontColor(): string {
    return this.outerWebColor(this.cssVar('--oc-diagram-grey'), this.cssVar('--oc-diagram-grey'));
  }

  private get isOuterLayerAccented(): boolean {
    const key = this.outerLayer.key;
    return !this.isDiagramLayerDisabled(key) && (this.isReferenceLayerActive(key) || this.isLayerHovered(key));
  }

  private outerWebColor(disabledColor: string, restColor: string): string {
    if (this.isDiagramLayerDisabled(this.outerLayer.key)) return disabledColor;
    return this.isOuterLayerAccented ? this.cssVar('--oc-white') : restColor;
  }

  trackByLayerKey(_: number, layer: OutcomesLayerConfig): string {
    return layer.key;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getLayerByKey(key: OutcomesLayerKey | string): OutcomesLayerConfig | undefined {
    return this.layers.find((layer) => layer.key === key);
  }

  isDiagramLayerDisabled(layerKey: OutcomesLayerKey | string): boolean {
    return this.disabledLayerKeys.has(layerKey as OutcomesLayerKey);
  }

  // Matches getReferenceLayerStroke/getDiagramLabelColor: in program mode every available
  // (non-disabled) layer is colored, not just the currently active/hovered one.
  isLayerIconActive(layerKey: OutcomesLayerKey): boolean {
    return !this.isDiagramLayerDisabled(layerKey) &&
      (this.hasProgramOutcomeData || this.isReferenceLayerActive(layerKey) || this.isLayerHovered(layerKey));
  }

  isReferenceLayerActive(layerKey: OutcomesLayerKey | string): boolean {
    const foundLayer = this.getLayerByKey(layerKey);
    if (!foundLayer) return false;
    return this.selectedLayerKey === foundLayer.key;
  }

  selectReferenceLayer(layerKey: OutcomesLayerKey | string): void {
    const foundLayer = this.getLayerByKey(layerKey);
    if (!foundLayer || this.isDiagramLayerDisabled(foundLayer.key)) return;

    this.layerSelect.emit(foundLayer.key);
  }

  selectReferenceLayerFromPointer(event: MouseEvent, fallbackLayerKey: OutcomesLayerKey | string): void {
    const layer = this.getLayerFromPointer(event) || this.getLayerByKey(fallbackLayerKey);
    if (!layer || this.isDiagramLayerDisabled(layer.key)) return;

    this.layerSelect.emit(layer.key);
  }

  onLayerKeydownSpace(event: Event, layerKey: OutcomesLayerKey): void {
    event.preventDefault();
    this.selectReferenceLayer(layerKey);
  }

  getReferenceLayerStrokeWidth(layerKey: OutcomesLayerKey | string): number {
    const foundLayer = this.getLayerByKey(layerKey);
    if (!foundLayer) return 1;

    const key = foundLayer.key;

    if (this.isDiagramLayerDisabled(key)) {
      return 1;
    }

    if (!this.hasProgramOutcomeData) {
      return 1.3;
    }

    return this.isReferenceLayerActive(key) ? 2 : 1;
  }

  getReferenceLayerFill(layerKey: OutcomesLayerKey | string): string {
    const foundLayer = this.getLayerByKey(layerKey);
    if (!foundLayer) return this.cssVar('--oc-fill-light');

    const key = foundLayer.key;

    if (this.isDiagramLayerDisabled(key)) {
      return this.cssVar('--oc-white');
    }

    if (this.isReferenceLayerActive(key) || this.isLayerHovered(key)) {
      return foundLayer.fill || this.cssVar('--oc-fill-light');
    }

    return this.cssVar('--oc-fill-light');
  }

  // The single ring with the largest outerRadius, i.e. the outermost layer in the diagram.
  private isOutermostLayer(layerKey: OutcomesLayerKey | string): boolean {
    if (!this.layers.length) return false;

    const maxOuterRadius = Math.max(...this.layers.map((layer) => layer.diagram.outerRadius));
    return this.getLayerByKey(layerKey)?.diagram.outerRadius === maxOuterRadius;
  }

  getReferenceLayerStroke(layerKey: OutcomesLayerKey | string): string {
    const foundLayer = this.getLayerByKey(layerKey);
    if (!foundLayer) return this.cssVar('--oc-stroke-light');

    const key = foundLayer.key;

    if (this.isDiagramLayerDisabled(key)) {
      return this.isOutermostLayer(key) ? 'none' : this.cssVar('--oc-disabled-border');
    }

    if (this.hasProgramOutcomeData || this.isReferenceLayerActive(key) || this.isLayerHovered(key)) {
      return foundLayer.color || this.cssVar('--oc-stroke-light');
    }

    return this.cssVar('--oc-stroke-light');
  }

  getReferenceLabelColor(layerKey: OutcomesLayerKey | string): string {
    const foundLayer = this.getLayerByKey(layerKey);
    if (!foundLayer) return this.cssVar('--oc-neutral-grey');

    const key = foundLayer.key;

    if (this.isDiagramLayerDisabled(key)) {
      return this.cssVar('--oc-disabled-border-light');
    }

    if (this.hasProgramOutcomeData || this.isReferenceLayerActive(key) || this.isLayerHovered(key)) {
      return foundLayer.color || this.cssVar('--oc-neutral-grey');
    }

    return this.cssVar('--oc-neutral-grey');
  }

  getLayerColor(layerKey: OutcomesLayerKey): string {
    return this.getLayerByKey(layerKey)?.color || this.cssVar('--oc-neutral-grey');
  }

  getLayerDiagramLabel(layerKey: OutcomesLayerKey): string {
    return this.getLayerByKey(layerKey)?.diagramLabel?.toLowerCase() || '';
  }

  gradientId(name: string): string {
    return `${this.instanceId}-${name}`;
  }

  gradientUrl(name: string): string {
    return `url(#${this.instanceId}-${name})`;
  }

  labelArcId(layerKey: OutcomesLayerKey | string): string {
    return `${this.instanceId}-lab-arc-${layerKey}`;
  }

  getLayerDataAttr(layer: OutcomesLayerConfig): string {
    return layer.diagram.dataLayerAttr || layer.key;
  }

  getLayerLabelForAttr(layer: OutcomesLayerConfig): string {
    return layer.diagram.labelForAttr || layer.key;
  }

  getLayerAriaLabel(layerKey: OutcomesLayerKey): string {
    const layer = this.getLayerByKey(layerKey);
    if (!layer) return '';

    const ariaKey = layerKey as keyof OutcomesAriaLabels;
    return this.config.ariaLabels[ariaKey] || layer.chipLabel || layer.key;
  }

  // Only reached for 'top'/'bottom' shapes — 'full' shapes render as a plain
  // <circle> in the template (see the *ngIf beside this binding's call site).
  getLayerPath(layer: OutcomesLayerConfig): string {
    const { innerRadius, outerRadius } = layer.diagram;
    const [startAngle, endAngle] = this.getAngles(layer.diagram.shape);

    return this.annularSectorPath(innerRadius, outerRadius, startAngle, endAngle);
  }

  shouldShowDiagramText(layer: OutcomesLayerConfig): boolean {
    return (layer.diagram.labelLayout || 'inline') !== 'icon-only';
  }

  setHoveredLayer(layerKey: OutcomesLayerKey): void {
    this.hoveredLayerKey = layerKey;
  }

  clearHoveredLayer(): void {
    this.hoveredLayerKey = null;
  }

  isLayerHovered(layerKey: OutcomesLayerKey | string): boolean {
    return this.hoveredLayerKey === layerKey;
  }

  getDiagramLabelColor(layerKey: OutcomesLayerKey): string {
    if (this.isDiagramLayerDisabled(layerKey)) {
      return this.cssVar('--oc-disabled-border-light');
    }

    if (this.hasProgramOutcomeData) {
      return this.getLayerColor(layerKey);
    }

    if (this.isReferenceLayerActive(layerKey) || this.isLayerHovered(layerKey)) {
      return this.getReferenceLabelColor(layerKey);
    }

    return this.getDiagramText(layerKey)?.fill || this.cssVar('--oc-stroke-grey');
  }

  getDiagramText(layerKey: OutcomesLayerKey) {
    return this.getLayerByKey(layerKey)?.diagram.text;
  }

  private getAngles(shape: OutcomesLayerShape): [number, number] {
    return shape === 'bottom' ? [0, 180] : [180, 360];
  }

  private getLayerFromPointer(event: MouseEvent): OutcomesLayerConfig | undefined {
    const svg = (event.currentTarget as SVGElement).ownerSVGElement || (event.currentTarget as SVGSVGElement);
    if (!svg || typeof svg.createSVGPoint !== 'function') return undefined;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const screenCtm = svg.getScreenCTM();
    if (!screenCtm) return undefined;

    const svgPoint = point.matrixTransform(screenCtm.inverse());
    const dx = svgPoint.x - this.diagramCenter;
    const dy = svgPoint.y - this.diagramCenter;
    const radius = Math.sqrt(dx * dx + dy * dy);
    const angle = this.normalizeAngle((Math.atan2(dy, dx) * 180) / Math.PI);

    return this.layers.find((layer) => this.isPointInsideLayer(layer, radius, angle));
  }

  private isPointInsideLayer(layer: OutcomesLayerConfig, radius: number, angle: number): boolean {
    if (this.isDiagramLayerDisabled(layer.key)) return false;

    const innerRadius = layer.diagram.innerRadius;
    const outerRadius = layer.diagram.isHitTarget
      ? layer.diagram.hitRadius || layer.diagram.outerRadius
      : layer.diagram.outerRadius;

    if (radius < innerRadius || radius > outerRadius) return false;

    if (layer.diagram.shape === 'full') return true;

    const [startAngle, endAngle] = this.getAngles(layer.diagram.shape);
    return angle >= startAngle && angle <= endAngle;
  }

  private normalizeAngle(angle: number): number {
    return (angle + 360) % 360;
  }

  private annularSectorPath(innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string {
    const outerStart = this.polarToCartesian(outerRadius, startAngle);
    const outerEnd = this.polarToCartesian(outerRadius, endAngle);
    const innerEnd = this.polarToCartesian(innerRadius, endAngle);
    const innerStart = this.polarToCartesian(innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  }

  private polarToCartesian(radius: number, angle: number): { x: number; y: number } {
    const radians = (angle * Math.PI) / 180;

    return {
      x: this.diagramCenter + radius * Math.cos(radians),
      y: this.diagramCenter + radius * Math.sin(radians),
    };
  }

  cssVar(name: string): string {
    if (this.cssVarCache.has(name)) {
      return this.cssVarCache.get(name)!;
    }

    let value = '';

    if (typeof window !== 'undefined' && typeof getComputedStyle === 'function') {
      value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    this.cssVarCache.set(name, value);
    return value;
  }
}
