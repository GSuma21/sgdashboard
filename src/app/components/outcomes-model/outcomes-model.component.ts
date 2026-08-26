import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as d3 from 'd3';
import { environment } from '../../../../environments/environment';
import { OUTCOMES_MODEL_CONFIG_PAGE } from '../../../constants/urlConstants';
import { OutcomesDiagramComponent } from '../outcomes-diagram/outcomes-diagram.component';
import { OutcomesEvidenceCarouselComponent } from '../outcomes-evidence-carousel/outcomes-evidence-carousel.component';
import { OutcomesInfoModalComponent } from '../outcomes-info-modal/outcomes-info-modal.component';
import { OutcomesProgramCardCarouselComponent } from '../outcomes-program-card-carousel/outcomes-program-card-carousel.component';
import {
  buildProgramOutcomeDataFromFramework,
  EMPTY_LAYER,
  EMPTY_OUTCOMES_MODEL_CONFIG,
  getEvidenceDisplayName,
  getEvidenceFileBackground,
  getEvidenceFileIcon,
  isValidOutcomesModelConfig,
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
  imports: [
    CommonModule,
    RouterModule,
    OutcomesDiagramComponent,
    OutcomesInfoModalComponent,
    OutcomesEvidenceCarouselComponent,
    OutcomesProgramCardCarouselComponent,
  ],
  templateUrl: './outcomes-model.component.html',
  styleUrls: ['./outcomes-model.component.css'],
})
export class OutcomesModelComponent implements OnChanges, OnInit {
  @Input() config: OutcomesModelConfig = EMPTY_OUTCOMES_MODEL_CONFIG;
  @Input() programOutcomeData?: ProgramOutcomeData;
  /** Raw `framework` array from the program-details API response; reshaped internally into `programOutcomeData`. */
  @Input() framework?: any[];
  @Input() programPartners: ProgramOutcomeCard[] = [];
  @Input() activeLayer?: OutcomesLayerKey;

  @ViewChild(OutcomesEvidenceCarouselComponent) private evidenceCarousel?: OutcomesEvidenceCarouselComponent;
  @ViewChild(OutcomesProgramCardCarouselComponent) private programCardCarousel?: OutcomesProgramCardCarouselComponent;

  selectedLayerKey: OutcomesLayerKey = this.config.defaultLayer;
  selectedPanel: 'programs' | 'layer' = 'layer';
  isInfoModalOpen = false;
  private hasExplicitLayerSelection = false;

  ngOnInit(): void {
    // Diagram styling/text always comes from OUTCOMES_MODEL_CONFIG_PAGE. Only fetch it if this
    // instance doesn't already have layer data (e.g. landing on program-details directly, with
    // no [config] passed in) — avoids re-fetching if a parent ever supplies [config] itself.
    if (!this.config?.layers?.length) {
      d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${OUTCOMES_MODEL_CONFIG_PAGE}`)
        .then((data: any) => {
          if (isValidOutcomesModelConfig(data)) {
            this.config = data;
            this.ngOnChanges();
          } else {
            console.error('Invalid outcomes model config payload received.');
          }
        })
        .catch((error: any) => {
          console.error('Error loading outcomes model config:', error);
        });
    }
  }

  ngOnChanges(): void {
    if (this.framework) {
      this.programOutcomeData = buildProgramOutcomeDataFromFramework(this.framework) ?? this.programOutcomeData;
    }

    if (this.activeLayer || this.programOutcomeData?.layerKey) {
      this.hasExplicitLayerSelection = true;
    }

    this.selectedLayerKey =
      this.activeLayer ||
      this.programOutcomeData?.layerKey ||
      (this.hasExplicitLayerSelection ? this.selectedLayerKey : this.config.defaultLayer);

    if (
      this.hasProgramOutcomeData &&
      !this.isProgramLayerAvailable(this.selectedLayerKey)
    ) {
      this.selectedLayerKey = this.firstAvailableProgramLayerKey;
    }

    this.selectedPanel = this.hasProgramOutcomeData ? 'programs' : this.selectedPanel;

    this.programCardCarousel?.reset();
    this.evidenceCarousel?.reset();
  }

  get layers(): OutcomesLayerConfig[] {
    return this.config.layers;
  }

  // The diagram (which draws its own outer ring) derives its own outerLayer; only
  // innerLayer is still needed here, for the info modal when there's no program data.
  get innerLayer(): OutcomesLayerConfig {
    const sortedByInnerRadius = [...this.layers].sort(
      (a, b) => a.diagram.innerRadius - b.diagram.innerRadius
    );
    return sortedByInnerRadius[0] || this.layers[0] || EMPTY_LAYER;
  }

  get selectedLayer(): OutcomesLayerConfig {
    return this.getLayerByKey(this.selectedLayerKey) || this.layers[0] || EMPTY_LAYER;
  }

  get displayProgramData(): ProgramOutcomeData | undefined {
    return this.programOutcomeData;
  }

  get selectedProgramData(): ProgramOutcomeData | undefined {
    const data = this.programOutcomeData;
    if (this.selectedLayerKey === 'network' && this.hasProgramPartners) {
      return this.programNetworkData;
    }

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

  // Mirrors .program-layer-tile's active-state contrast rule (see outcomes-model.component.css):
  // the base "students"/programColor accent is a light orange that needs dark text, every
  // other layer color is dark enough for white text.
  get activeTextColor(): string {
    const isOrangeAccent = this.shouldShowProgramPanel || this.selectedLayerKey === 'students';
    return isOrangeAccent ? 'var(--oc-black)' : 'var(--oc-white)';
  }

  get hasProgramOutcomeData(): boolean {
    return !!this.programOutcomeData || this.hasProgramPartners;
  }

  get hasProgramPartners(): boolean {
    return (this.programPartners || []).length > 0;
  }

  get programNetworkData(): ProgramOutcomeData {
    return {
      layerKey: 'network',
      title: this.getLayerByKey('network')?.heading || this.getLayerByKey('network')?.chipLabel || 'Network',
      cardVariant: 'partner',
      outcomes: this.programPartners || [],
    };
  }

  get programBaseLayerKey(): OutcomesLayerKey {
    return this.programOutcomeData?.layerKey || this.config.defaultLayer;
  }

  get firstAvailableProgramLayerKey(): OutcomesLayerKey {
    return this.layers.find((layer) => this.isProgramLayerAvailable(layer.key))?.key || this.config.defaultLayer;
  }

  get infoModalLayer(): OutcomesLayerConfig {
    return this.hasProgramOutcomeData ? this.selectedLayer : this.innerLayer;
  }

  private get staticTexts(): NonNullable<OutcomesModelConfig['staticTexts']> {
    return this.config.staticTexts || {};
  }

  get infoModalTitle(): string {
    const prefix = this.staticTexts.infoModalTitlePrefix || 'About';
    return this.infoModalLayer.heading || this.infoModalLayer.eyebrow || this.infoModalLayer.chipLabel || `${prefix} ${this.infoModalLayer.chipLabel}`;
  }

  get infoModalDescription(): string {
    const prefix = this.staticTexts.infoModalDescriptionPrefix || 'Information about';
    return this.hasProgramOutcomeData ? this.narrativeBody : this.infoModalLayer.subheading || this.narrativeBody || `${prefix} ${this.infoModalLayer.chipLabel}`;
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
    return this.selectedLayer.heading || this.selectedLayer.eyebrow || this.selectedLayer.chipLabel;
  }

  get programPanelDescription(): string {
    return this.narrativeBody || this.staticTexts.programModeDescription || 'View program outcomes and evidence';
  }

  get programCards(): ProgramOutcomeCard[] {
    return (
      this.selectedProgramData?.outcomes ||
      this.programOutcomeData?.outcomesByLayer?.[this.selectedLayerKey] ||
      []
    );
  }

  get programPanelIcon(): string {
    return this.selectedLayer.imgPath;
  }

  get programEvidenceResources(): ProgramEvidenceResource[] {
    return (
      this.selectedProgramData?.evidences ||
      this.programOutcomeData?.evidencesByLayer?.[this.selectedLayerKey] ||
      []
    );
  }

  get programCardVariant(): 'outcome' | 'partner' {
    return this.selectedProgramData?.cardVariant || 'outcome';
  }

  // Narrative pills render in two rows of up to 3; kept as named slices so the
  // split isn't a bare magic number repeated in the template.
  get primaryLayers(): OutcomesLayerConfig[] {
    return this.layers.slice(0, 3);
  }

  get secondaryLayers(): OutcomesLayerConfig[] {
    return this.layers.slice(3);
  }

  // Every layer's disabled state, precomputed once for the diagram child component
  // (it has no access to programOutcomeData, so it can't derive this itself).
  get disabledLayerKeys(): Set<OutcomesLayerKey> {
    return new Set(
      this.layers.filter((layer) => this.isDiagramLayerDisabled(layer.key)).map((layer) => layer.key)
    );
  }

  selectLayer(layerKey: OutcomesLayerKey): void {
    if (this.hasProgramOutcomeData && !this.isProgramLayerAvailable(layerKey)) {
      return;
    }

    this.selectedLayerKey = layerKey;
    this.hasExplicitLayerSelection = true;
    this.selectedPanel = 'layer';

    this.programCardCarousel?.reset();
    this.evidenceCarousel?.reset();
  }

  selectProgramPanel(): void {
    if (!this.hasProgramOutcomeData) return;

    this.selectedPanel = 'programs';
    this.programCardCarousel?.reset();
    this.evidenceCarousel?.reset();
  }

  // `index` is the card's absolute position in the (unpaginated) list — the caller
  // owns pagination, if any, and is responsible for passing the right index.
  getProgramCardLabel(card: ProgramOutcomeCard, index: number): string {
    return (
      card.label ||
      card.title ||
      card.name ||
      card.heading ||
      card.partner ||
      `${this.config.defaultCardLabelPrefix}${index + 1}`
    );
  }

  getProgramCardDescription(card: ProgramOutcomeCard): string {
    return card.description || card.body || card.text || card.value || card.about_the_program_objective || '';
  }

  isProgramLayerAvailable(layerKey: OutcomesLayerKey): boolean {
    if (layerKey === 'network' && this.hasProgramPartners) return true;
    if (!this.programOutcomeData) return false;

    const layerData = this.getProgramLayerData(layerKey);
    const hasLayerData = this.hasProgramContent(layerData);
    const hasGroupedData = !!(
      this.programOutcomeData.outcomesByLayer?.[layerKey]?.length ||
      this.programOutcomeData.evidencesByLayer?.[layerKey]?.length
    );
    const hasBaseData = layerKey === this.programBaseLayerKey && this.hasProgramContent(this.programOutcomeData);

    return hasLayerData || hasGroupedData || hasBaseData;
  }

  trackByLayerKey(_: number, layer: OutcomesLayerConfig): string {
    return layer.key;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private getProgramLayerData(layerKey: OutcomesLayerKey): ProgramOutcomeData | undefined {
    if (layerKey === 'network' && this.hasProgramPartners) {
      return this.programNetworkData;
    }

    const layers = this.programOutcomeData?.layers;
    if (!layers) return undefined;

    if (Array.isArray(layers)) {
      return layers.find((layer) => layer.layerKey === layerKey);
    }

    return layers[layerKey];
  }

  private hasProgramContent(data?: ProgramOutcomeData): boolean {
    return !!(data?.title || data?.subtitle || data?.outcomes?.length || data?.evidences?.length);
  }

  // The program's own layer title (e.g. "Learners Outcomes" from `framework[].impact_layer`),
  // used to override the static config label when program data is loaded.
  private getProgramLayerTitle(layerKey: OutcomesLayerKey): string | undefined {
    if (!this.hasProgramOutcomeData) return undefined;

    return layerKey === this.programBaseLayerKey
      ? this.programOutcomeData?.title
      : this.getProgramLayerData(layerKey)?.title;
  }

  getLayerTileLabel(layer: OutcomesLayerConfig): string {
    return this.getProgramLayerTitle(layer.key) || layer.chipLabel;
  }

  isDiagramLayerDisabled(layerKey: OutcomesLayerKey): boolean {
    return this.hasProgramOutcomeData &&
      !this.isProgramLayerAvailable(layerKey);
  }

  getEvidenceDisplayName(evidence: ProgramEvidenceResource): string {
    return getEvidenceDisplayName(evidence, this.staticTexts.evidenceNameFallbackSuffix);
  }

  getEvidenceFileIcon(evidence: ProgramEvidenceResource): string {
    return getEvidenceFileIcon(evidence.evidence_type);
  }

  getEvidenceFileBackground(evidence: ProgramEvidenceResource): string {
    return getEvidenceFileBackground(evidence.evidence_type);
  }

  getSafeEvidenceUrl(evidence: ProgramEvidenceResource): string | null {
    if (!evidence?.url) return null;

    try {
      const url = new URL(evidence.url, typeof window !== 'undefined' ? window.location.origin : undefined);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch {
      return null;
    }
  }

  getLayerByKey(key: OutcomesLayerKey | string): OutcomesLayerConfig | undefined {
    return this.layers.find((layer) => layer.key === key);
  }
}
