import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  OUTCOMES_MODEL_CONFIG,
  OutcomesDiagramIcon,
  OutcomesLayerConfig,
  OutcomesLayerKey,
  OutcomesModelConfig,
  ProgramEvidenceResource,
  ProgramOutcomeCard,
  ProgramOutcomeData,
} from './outcomes-model.config';

@Component({
  selector: 'app-outcomes-model',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './outcomes-model.component.html',
  styleUrls: ['./outcomes-model.component.css'],
})
export class OutcomesModelComponent implements OnChanges {
  @Input() config: OutcomesModelConfig = OUTCOMES_MODEL_CONFIG;
  @Input() programOutcomeData?: ProgramOutcomeData;
  @Input() activeLayer?: OutcomesLayerKey;
  @Input() showProgramPanel = false;

  selectedLayerKey: OutcomesLayerKey = this.config.defaultLayer;
  hoveredLayerKey: OutcomesLayerKey | null = null;
  selectedPanel: 'programs' | 'layer' = 'layer';
  isInfoModalOpen = false;
  cardPageIndex = 0;
  private readonly MOBILE_BREAKPOINT = 768;
  private readonly diagramCenter = 300;
  evidencesPerPage = 2;
  evidencePageIndex = 0;
  tooltipText: string | null = null;
  tooltipTop = 0;
  tooltipLeft = 0;
  tooltipVisible = false;
  private readonly cssVarCache = new Map<string, string>();

  ngOnChanges(): void {
    this.selectedLayerKey =
      this.activeLayer ||
      this.programOutcomeData?.layerKey ||
      this.selectedLayerKey ||
      this.config.defaultLayer;

    if (
      this.hasProgramOutcomeData &&
      !this.isProgramLayerAvailable(this.selectedLayerKey)
    ) {
      this.selectedLayerKey = this.firstAvailableProgramLayerKey;
    }

    this.selectedPanel =
      this.showProgramPanel && this.hasProgramOutcomeData
        ? 'programs'
        : this.selectedPanel;

    this.cardPageIndex = 0;
    this.evidencePageIndex = 0;
  }

    @HostListener('window:resize')
  onWindowResize(): void {
    const newEvidencePerPage = this.isMobileViewport() ? 1 : 2;

    if (this.evidencesPerPage !== newEvidencePerPage) {
      this.evidencesPerPage = newEvidencePerPage;

      if (this.evidencePageIndex >= this.evidencePageCount) {
        this.evidencePageIndex = Math.max(0, this.evidencePageCount - 1);
      }
    }

    // programCardsPerPage is now viewport-driven too — reclamp cardPageIndex
    if (this.cardPageIndex >= this.programCardPageCount) {
      this.cardPageIndex = Math.max(0, this.programCardPageCount - 1);
    }
  }

  get layers(): OutcomesLayerConfig[] {
    return this.config.layers;
  }

  get selectedLayer(): OutcomesLayerConfig {
    return this.layers.find((layer) => layer.key === this.selectedLayerKey) || this.layers[0];
  }

  get displayProgramData(): ProgramOutcomeData | undefined {
    return this.programOutcomeData;
  }

  get selectedProgramData(): ProgramOutcomeData | undefined {
    const data = this.programOutcomeData;
    if (!data) return undefined;

    const layerData = this.getProgramLayerData(this.selectedLayerKey);
    if (layerData) return layerData;

    return this.selectedLayerKey === this.programBaseLayerKey ? data : undefined;
  }

  get shouldShowProgramPanel(): boolean {
    return this.hasProgramOutcomeData && this.selectedPanel === 'programs';
  }

  get activePanelColor(): string {
    return this.shouldShowProgramPanel ? this.config.programColor : this.selectedLayer.color;
  }

  get hasProgramOutcomeData(): boolean {
    return !!this.programOutcomeData;
  }

  get programBaseLayerKey(): OutcomesLayerKey {
    return this.programOutcomeData?.layerKey || this.config.defaultLayer;
  }

  get firstAvailableProgramLayerKey(): OutcomesLayerKey {
    return this.layers.find((layer) => this.isProgramLayerAvailable(layer.key))?.key || this.config.defaultLayer;
  }

  get studentInfoLayer(): OutcomesLayerConfig {
    return this.layers.find((layer) => layer.key === 'students') || this.layers[0];
  }

  get infoModalLayer(): OutcomesLayerConfig {
    return this.hasProgramOutcomeData ? this.selectedLayer : this.studentInfoLayer;
  }

  get infoModalTitle(): string {
    return this.infoModalLayer.heading || this.infoModalLayer.eyebrow || this.infoModalLayer.chipLabel;
  }

  get infoModalDescription(): string {
    return this.hasProgramOutcomeData ? this.narrativeBody : this.studentInfoLayer.subheading || this.narrativeBody;
  }

  get narrativeBody(): string {
    if (this.selectedLayer.subheading) {
      return this.selectedLayer.subheading;
    }

    if (this.selectedLayer.body) {
      return this.selectedLayer.body;
    }

    if (this.selectedLayer.listItems?.length) {
      return this.selectedLayer.listItems.map((item) => `${item.title}: ${item.description}`).join(' ');
    }

    return this.config.defaultNarrativeBody;
  }

  get frameworkLead(): string {
    return this.config.frameworkLead;
  }

  get programPanelTitle(): string {
    return this.selectedLayer.heading || this.selectedLayer.eyebrow || `${this.selectedLayer.chipLabel}:`;
  }

  get programPanelDescription(): string {
    return this.narrativeBody;
  }

  get programCards(): ProgramOutcomeCard[] {
    return (
      this.selectedProgramData?.cards ||
      this.programOutcomeData?.cardsByLayer?.[this.selectedLayerKey] ||
      []
    );
  }

  get programPanelIcon(): string {
    return this.selectedLayer.imgPath;
  }

  get visibleProgramCards(): ProgramOutcomeCard[] {
    const startIndex = this.cardPageIndex * this.programCardsPerPage;
    return this.programCards.slice(startIndex, startIndex + this.programCardsPerPage);
  }

  get programEvidenceResources(): ProgramEvidenceResource[] {
    return (
      this.selectedProgramData?.evidences ||
      this.programOutcomeData?.evidencesByLayer?.[this.selectedLayerKey] ||
      []
    );
  }

  get programCardPageCount(): number {
    return Math.max(1, Math.ceil(this.programCards.length / this.programCardsPerPage));
  }

  get canShowProgramCardControls(): boolean {
    return this.programCards.length > this.programCardsPerPage;
  }

  get canGoToPreviousProgramCards(): boolean {
    return this.cardPageIndex > 0;
  }

  get canGoToNextProgramCards(): boolean {
    return this.cardPageIndex < this.programCardPageCount - 1;
  }

  get programCardVariant(): 'outcome' | 'partner' {
    return this.selectedProgramData?.cardVariant || 'outcome';
  }

  get dividerSegments(): Array<{ x1: number; x2: number }> {
    const splitRingKeys = new Set(
      this.layers
        .filter((layer) => layer.diagram.shape !== 'full')
        .map((layer) => `${layer.diagram.innerRadius}-${layer.diagram.outerRadius}`)
    );

    return Array.from(splitRingKeys).flatMap((key) => {
      const [innerRadius, outerRadius] = key.split('-').map(Number);
      const hasTop = this.layers.some(
        (layer) =>
          layer.diagram.shape === 'top' &&
          layer.diagram.innerRadius === innerRadius &&
          layer.diagram.outerRadius === outerRadius
      );
      const hasBottom = this.layers.some(
        (layer) =>
          layer.diagram.shape === 'bottom' &&
          layer.diagram.innerRadius === innerRadius &&
          layer.diagram.outerRadius === outerRadius
      );

      if (!hasTop || !hasBottom) {
        return [];
      }

      return [
        {
          x1: this.diagramCenter - outerRadius,
          x2: this.diagramCenter - innerRadius,
        },
        {
          x1: this.diagramCenter + innerRadius,
          x2: this.diagramCenter + outerRadius,
        },
      ];
    });
  }

  selectLayer(layerKey: OutcomesLayerKey): void {
    if (this.hasProgramOutcomeData && !this.isProgramLayerAvailable(layerKey)) {
      return;
    }

    this.selectedLayerKey = layerKey;
    this.selectedPanel = 'layer';

    this.cardPageIndex = 0;
    this.evidencePageIndex = 0;
  }

  selectProgramPanel(): void {
    if (!this.hasProgramOutcomeData) return;

    this.selectedPanel = 'programs';
    this.cardPageIndex = 0;
    this.evidencePageIndex = 0;
  }

  showPreviousProgramCards(): void {
    this.cardPageIndex = Math.max(0, this.cardPageIndex - 1);
  }

  showNextProgramCards(): void {
    this.cardPageIndex = Math.min(this.programCardPageCount - 1, this.cardPageIndex + 1);
  }

  getProgramCardLabel(card: ProgramOutcomeCard, index: number): string {
    return (
      card.label ||
      card.title ||
      card.name ||
      card.heading ||
      card.partner ||
      `${this.config.defaultCardLabelPrefix}${this.cardPageIndex * this.programCardsPerPage + index + 1}`
    );
  }

  getProgramCardDescription(card: ProgramOutcomeCard): string {
    return card.description || card.body || card.text || card.value || card.about_the_program_objective || '';
  }

  getProgramCardImage(card: ProgramOutcomeCard): string {
    return card.src || card.logo || card.image || this.config.defaultPartnerImage;
  }

  getProgramCardLink(card: ProgramOutcomeCard): string | undefined {
    return card.website || card.url;
  }

  isProgramLayerAvailable(layerKey: OutcomesLayerKey): boolean {
    if (!this.programOutcomeData) return true;

    const layerData = this.getProgramLayerData(layerKey);
    const hasLayerData = this.hasProgramContent(layerData);
    const hasGroupedData = !!(
      this.programOutcomeData.cardsByLayer?.[layerKey]?.length ||
      this.programOutcomeData.evidencesByLayer?.[layerKey]?.length
    );
    const hasBaseData = layerKey === this.programBaseLayerKey && this.hasProgramContent(this.programOutcomeData);

    return hasLayerData || hasGroupedData || hasBaseData;
  }

  openInfoModal(): void {
    this.isInfoModalOpen = true;
  }

  closeInfoModal(): void {
    this.isInfoModalOpen = false;
  }

  trackByLayerKey(_: number, layer: OutcomesLayerConfig): string {
    return layer.key;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private getProgramLayerData(layerKey: OutcomesLayerKey): ProgramOutcomeData | undefined {
    const layers = this.programOutcomeData?.layers;
    if (!layers) return undefined;

    if (Array.isArray(layers)) {
      return layers.find((layer) => layer.layerKey === layerKey);
    }

    return layers[layerKey];
  }

  private hasProgramContent(data?: ProgramOutcomeData): boolean {
    return !!(data?.title || data?.subtitle || data?.cards?.length || data?.evidences?.length);
  }

  getLayerPath(layer: OutcomesLayerConfig): string {
    const { innerRadius, outerRadius } = layer.diagram;
    const [startAngle, endAngle] = this.getAngles(layer.diagram.shape);

    return layer.diagram.shape === 'full'
      ? this.annularCirclePath(innerRadius, outerRadius)
      : this.annularSectorPath(innerRadius, outerRadius, startAngle, endAngle);
  }

  getLayerLabelTransform(layer: OutcomesLayerConfig): string {
    return `translate(${layer.diagram.labelX} ${layer.diagram.labelY})`;
  }

  getLabelTextX(layer: OutcomesLayerConfig): number {
    return layer.diagram.textOffsetX ?? 0;
  }

  getLabelTextY(layer: OutcomesLayerConfig): number {
    return layer.diagram.textOffsetY ?? 0;
  }

  getIconX(layer: OutcomesLayerConfig): number {
    return layer.diagram.iconOffsetX ?? 0;
  }

  getIconY(layer: OutcomesLayerConfig): number {
    return layer.diagram.iconOffsetY ?? 0;
  }

  getImageX(layer: OutcomesLayerConfig): number {
    return this.getIconX(layer) - (layer.diagram.icon.width || 28) / 2;
  }

  getImageY(layer: OutcomesLayerConfig): number {
    return this.getIconY(layer) - (layer.diagram.icon.height || 28) / 2;
  }

  shouldShowDiagramText(layer: OutcomesLayerConfig): boolean {
    return (layer.diagram.labelLayout || 'inline') !== 'icon-only';
  }

  isLayerActive(layerKey: OutcomesLayerKey): boolean {
    return this.selectedLayerKey === layerKey;
  }

  isReferenceLayerActive(referenceLayer: 'learner' | 'school' | 'community' | 'society' | 'system' | 'network'): boolean {
    return this.selectedLayerKey === this.referenceLayerToKey(referenceLayer);
  }

  selectReferenceLayer(
    referenceLayer:
      | 'learner'
      | 'school'
      | 'community'
      | 'society'
      | 'system'
      | 'network'
  ): void {
    const layerKey = this.referenceLayerToKey(referenceLayer);

    if (this.isDiagramLayerDisabled(layerKey)) {
      return;
    }

    this.selectLayer(layerKey);
  }

  getReferenceLayerStrokeWidth(
    referenceLayer: 'learner' | 'school' | 'community' | 'society' | 'system' | 'network'
  ): number {
    const layerKey = this.referenceLayerToKey(referenceLayer);

    if (this.isDiagramLayerDisabled(layerKey)) {
      return 1;
    }

    // Only vary width on the programs page; home page keeps the original flat width
    if (!this.hasProgramOutcomeData) {
      return 1.3;
    }

    return this.isReferenceLayerActive(referenceLayer) ? 2 : 1;
  }

  getLayerDiagramLabel(layerKey: OutcomesLayerKey): string {
    return this.layers.find((layer) => layer.key === layerKey)?.diagramLabel.toLowerCase() || '';
  }

    getLayerIconColor(layer: OutcomesLayerConfig): string {
    if (this.isDiagramLayerDisabled(layer.key)) {
      return this.cssVar('--oc-disabled-border-light');
    }

    if (this.hasProgramOutcomeData) {
      return layer.diagram.icon.color || layer.color || this.cssVar('--oc-neutral-grey');
    }

    return this.isLayerActive(layer.key)
      ? layer.diagram.icon.color || layer.color
      : this.cssVar('--oc-inactive-icon');
  }

  getReferenceLayerFill(
    referenceLayer: 'learner' | 'school' | 'community' | 'society' | 'system' | 'network'
  ): string {
    const layerKey = this.referenceLayerToKey(referenceLayer);
    const layer = this.layers.find(item => item.key === layerKey);

    if (this.isDiagramLayerDisabled(layerKey)) {
      return this.cssVar('--oc-white');
    }

    if (this.isReferenceLayerActive(referenceLayer) || this.isLayerHovered(layerKey)) {
      return layer?.fill || this.cssVar('--oc-fill-light');
    }

    return this.cssVar('--oc-fill-light');
  }

  getReferenceLayerStroke(
    referenceLayer: 'learner' | 'school' | 'community' | 'society' | 'system' | 'network'
  ): string {
    const layerKey = this.referenceLayerToKey(referenceLayer);
    const layer = this.layers.find(item => item.key === layerKey);

    if (this.isDiagramLayerDisabled(layerKey)) {
      return this.cssVar('--oc-disabled-border');
    }

    if (this.hasProgramOutcomeData) {
      return layer?.color || this.cssVar('--oc-stroke-light');
    }

    if (this.isReferenceLayerActive(referenceLayer) || this.isLayerHovered(layerKey)) {
      return layer?.color || this.cssVar('--oc-stroke-light');
    }

    return this.cssVar('--oc-stroke-light');
  }

  getReferenceLabelColor(
    referenceLayer: 'learner' | 'school' | 'community' | 'society' | 'system' | 'network'
  ): string {
    const layerKey = this.referenceLayerToKey(referenceLayer);
    const layer = this.layers.find(item => item.key === layerKey);

    if (this.isDiagramLayerDisabled(layerKey)) {
      return this.cssVar('--oc-disabled-border-light');
    }

    if (this.hasProgramOutcomeData) {
      return layer?.color || this.cssVar('--oc-neutral-grey');
    }

    if (this.isReferenceLayerActive(referenceLayer) || this.isLayerHovered(layerKey)) {
      return layer?.color || this.cssVar('--oc-neutral-grey');
    }

    return this.cssVar('--oc-neutral-grey');
  }

  getLayerColor(layerKey: OutcomesLayerKey): string {
    return this.layers.find((layer) => layer.key === layerKey)?.color || this.cssVar('--oc-neutral-grey');
  }

  getCurvedLabelColor(layerKey: OutcomesLayerKey): string {
    return this.isLayerActive(layerKey) ? this.getLayerColor(layerKey) : this.cssVar('--oc-neutral-grey');
  }

  private referenceLayerToKey(referenceLayer: 'learner' | 'school' | 'community' | 'society' | 'system' | 'network'): OutcomesLayerKey {
    const layerMap: Record<typeof referenceLayer, OutcomesLayerKey> = {
      learner: 'students',
      school: 'schools',
      community: 'community',
      society: 'society',
      system: 'system',
      network: 'network',
    };

    return layerMap[referenceLayer];
  }

  private getAngles(shape: 'full' | 'top' | 'bottom'): [number, number] {
    return shape === 'bottom' ? [0, 180] : [180, 360];
  }

  private annularCirclePath(innerRadius: number, outerRadius: number): string {
    if (innerRadius <= 0) {
      const outerTop = this.polarToCartesian(outerRadius, 270);
      const outerBottom = this.polarToCartesian(outerRadius, 90);

      return [
        `M ${outerTop.x} ${outerTop.y}`,
        `A ${outerRadius} ${outerRadius} 0 1 1 ${outerBottom.x} ${outerBottom.y}`,
        `A ${outerRadius} ${outerRadius} 0 1 1 ${outerTop.x} ${outerTop.y}`,
        'Z',
      ].join(' ');
    }

    const outerTop = this.polarToCartesian(outerRadius, 270);
    const outerBottom = this.polarToCartesian(outerRadius, 90);
    const innerTop = this.polarToCartesian(innerRadius, 270);
    const innerBottom = this.polarToCartesian(innerRadius, 90);

    return [
      `M ${outerTop.x} ${outerTop.y}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${outerBottom.x} ${outerBottom.y}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${outerTop.x} ${outerTop.y}`,
      `M ${innerTop.x} ${innerTop.y}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${innerBottom.x} ${innerBottom.y}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${innerTop.x} ${innerTop.y}`,
      'Z',
    ].join(' ');
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

  setHoveredLayer(layerKey: OutcomesLayerKey): void {
    this.hoveredLayerKey = layerKey;
  }

  clearHoveredLayer(): void {
    this.hoveredLayerKey = null;
  }

  isLayerHovered(layerKey: OutcomesLayerKey): boolean {
    return this.hoveredLayerKey === layerKey;
  }

  get programCardPages(): number[] {
    return Array.from(
      { length: this.programCardPageCount },
      (_, index) => index
    );
  }

  goToProgramCardPage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this.programCardPageCount) {
      return;
    }

    this.cardPageIndex = pageIndex;
  }

  get visibleEvidenceResources(): ProgramEvidenceResource[] {
    const startIndex = this.evidencePageIndex * this.evidenceCardsPerPage;

    return this.programEvidenceResources.slice(
      startIndex,
      startIndex + this.evidenceCardsPerPage
    );
  }

  get evidencePageCount(): number {
    return Math.max(
      1,
      Math.ceil(
        this.programEvidenceResources.length / this.evidencesPerPage
      )
    );
  }

  get canShowEvidenceControls(): boolean {
    return this.programEvidenceResources.length > this.evidencesPerPage;
  }

  get canGoToPreviousEvidence(): boolean {
    return this.evidencePageIndex > 0;
  }

  get canGoToNextEvidence(): boolean {
    return this.evidencePageIndex < this.evidencePageCount - 1;
  }

  showPreviousEvidence(): void {
    this.evidencePageIndex = Math.max(
      0,
      this.evidencePageIndex - 1
    );
  }

  showNextEvidence(): void {
    this.evidencePageIndex = Math.min(
      this.evidencePageCount - 1,
      this.evidencePageIndex + 1
    );
  }

    get evidenceThumbWidthPercent(): number {
    const total = this.programEvidenceResources.length;
    if (!total) return 0;

    const width = (this.evidenceCardsPerPage / total) * 100;
    return Math.min(100, width);
  }

  get evidenceThumbLeftPercent(): number {
    const totalPages = this.evidencePageCount;
    if (totalPages <= 1) return 0;

    const widthPercent = this.evidenceThumbWidthPercent;
    return (this.evidencePageIndex / (totalPages - 1)) * (100 - widthPercent);
  }

    get evidenceCardsPerPage(): number {
    return this.isMobileViewport() ? 1 : 2;
  }

  isDiagramLayerDisabled(layerKey: OutcomesLayerKey): boolean {
    return this.hasProgramOutcomeData &&
      !this.isProgramLayerAvailable(layerKey);
  }

  showTooltip(event: MouseEvent, text: string): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.tooltipText = text;
    this.tooltipTop = rect.top - 8;
    this.tooltipLeft = rect.left + rect.width / 2;
    this.tooltipVisible = true;
  }

  hideTooltip(): void {
    this.tooltipVisible = false;
  }

  toggleTooltipMobile(event: MouseEvent, text: string): void {
    if (this.tooltipVisible && this.tooltipText === text) {
      this.hideTooltip();
    } else {
      this.showTooltip(event, text);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.program-mode-tag')) {
      this.hideTooltip();
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    this.hideTooltip();
  }

  truncateLabel(text: string, limit = 21): string {
    if (!text) return '';
    return text.length > limit ? text.slice(0, limit) + '...' : text;
  }

  isLabelTruncated(text: string, limit = 21): boolean {
    return !!text && text.length > limit;
  }

  openEvidence(event: MouseEvent, evidence: ProgramEvidenceResource): void {
    event.preventDefault();
    event.stopPropagation();

    if (evidence?.url) {
      window.open(evidence.url, '_blank', 'noopener,noreferrer');
    }
  }

  private cssVar(name: string): string {
    if (this.cssVarCache.has(name)) {
      return this.cssVarCache.get(name)!;
    }

    let value = '';

    if (typeof window !== 'undefined' && typeof getComputedStyle === 'function') {
      value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    if (!value) {
      console.warn(`[OutcomesModelComponent] Missing CSS variable "${name}" in style.css`);
    }

    this.cssVarCache.set(name, value);
    return value;
  }

  get programCardsPerPage(): number {
    return this.isMobileViewport() ? 1 : 3;
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= this.MOBILE_BREAKPOINT;
  }

  getDiagramIcon(layerKey: OutcomesLayerKey): OutcomesDiagramIcon {
  const layer = this.config.layers.find(
    (item) => item.key === layerKey
  );

  return layer?.diagram.icon ?? {
    type: 'image',
    value: '',
  };
}

getDiagramText(layerKey: OutcomesLayerKey) {
  return this.layers.find(layer => layer.key === layerKey)?.diagram.text;
}
}