export type OutcomesLayerKey =
  | 'students'
  | 'schools'
  | 'community'
  | 'society'
  | 'system'
  | 'network';

export type OutcomesPanelType = 'programs' | 'list' | 'story';
export type OutcomesLayerShape = 'full' | 'top' | 'bottom';

export interface OutcomesDiagramIcon {
  type: 'material' | 'image';
  value: string;
  color?: string;
  width?: number;
  height?: number;
}

export interface OutcomesDiagramConfig {
  shape: OutcomesLayerShape;
  innerRadius: number;
  outerRadius: number;
  labelX: number;
  labelY: number;
  labelLayout?: 'inline' | 'stacked' | 'icon-only';
  labelAnchor?: 'start' | 'middle' | 'end';
  iconOffsetX?: number;
  iconOffsetY?: number;
  textOffsetX?: number;
  textOffsetY?: number;
  icon: OutcomesDiagramIcon;
  iconX: number;
  iconY: number;
  curvedLabelPath?: string;
  labelForAttr?: string;
  dataLayerAttr?: string;
  hitRadius?: number;
  isHitTarget?: boolean;
  text?: {
    x: number;
    y: number;
    fill?: string;
    fontSize?: number;
    fontWeight?: number;
  };
}

export interface OutcomesListItem {
  letter: string;
  icon: string;
  title: string;
  description: string;
}

export interface OutcomesCta {
  label: string;
  link: string;
}

export interface OutcomesLayerConfig {
  key: OutcomesLayerKey;
  chipLabel: string;
  diagramLabel: string;
  icon: string;
  color: string;
  fill: string;
  diagram: OutcomesDiagramConfig;
  panelType: OutcomesPanelType;
  imgPath: string;
  heading?: string;
  eyebrow?: string;
  subheading?: string;
  body?: string;
  frameworkNote?: string;
  cta?: OutcomesCta;
  frameworkCta?: OutcomesCta;
  listItems?: OutcomesListItem[];
}

export interface ProgramOutcomeCard {
  label?: string;
  title?: string;
  name?: string;
  heading?: string;
  partner?: string;
  src?: string;
  logo?: string;
  image?: string;
  alt?: string;
  website?: string;
  url?: string;
  ctaLabel?: string;
  description?: string;
  body?: string;
  text?: string;
  value?: string;
  about_the_program_objective?: string;
}

export interface ProgramEvidenceResource {
  evidence_name?: string;
  evidence_size_bytes?: number;
  evidence_size?: string;
  evidence_mime_type?: string;
  evidence_type?: string;
  tag: string;
  url?: string;
}

// Default when the fetched config doesn't supply staticTexts.evidenceNameFallbackSuffix.
export const EVIDENCE_NAME_FALLBACK_SUFFIX = 'document';

// Falls back to "<tag> <suffix>" (e.g. "Dental Revision document") when the API doesn't
// provide a file name for an evidence resource. `fallbackSuffix` should come from the
// fetched config's staticTexts.evidenceNameFallbackSuffix; defaults to the word "document" above.
// Uses `||` rather than a default parameter because Angular's template `?.` short-circuits
// to `null` (not `undefined`), which a default parameter wouldn't catch.
export function getEvidenceDisplayName(
  evidence: ProgramEvidenceResource,
  fallbackSuffix?: string | null
): string {
  return evidence.evidence_name || `${evidence.tag} ${fallbackSuffix || EVIDENCE_NAME_FALLBACK_SUFFIX}`;
}

export const EVIDENCE_MEDIA_TYPE = {
  PDF: 'PDF',
  DOCX: 'DOCX',
  DOC: 'DOC',
  XLSX: 'XLSX',
  CSV: 'CSV',
  PPTX: 'PPTX',
} as const;

// Icon files referenced here still need to be added under public/assets/icons/.
const EVIDENCE_FILE_TYPE_ICONS: Record<string, string> = {
  [EVIDENCE_MEDIA_TYPE.PDF]: 'assets/icons/pdf.svg',
  [EVIDENCE_MEDIA_TYPE.DOCX]: 'assets/icons/docx.svg',
  [EVIDENCE_MEDIA_TYPE.DOC]: 'assets/icons/docx.svg',
  [EVIDENCE_MEDIA_TYPE.XLSX]: 'assets/icons/xlsx.svg',
  [EVIDENCE_MEDIA_TYPE.CSV]: 'assets/icons/xlsx.svg',
  [EVIDENCE_MEDIA_TYPE.PPTX]: 'assets/icons/pptx.svg',
};

const DEFAULT_EVIDENCE_FILE_ICON = 'assets/icons/file-default.svg';

export function getEvidenceFileIcon(type?: string): string {
  return EVIDENCE_FILE_TYPE_ICONS[type?.toUpperCase() || ''] || DEFAULT_EVIDENCE_FILE_ICON;
}

// The icon SVGs are solid white, drawn to sit on a colored badge (not directly on
// the card's white background), so each file type needs its own backdrop color.
const EVIDENCE_FILE_TYPE_BACKGROUNDS: Record<string, string> = {
  [EVIDENCE_MEDIA_TYPE.PDF]: 'var(--oc-pdf-bg)',
  [EVIDENCE_MEDIA_TYPE.DOCX]: 'var(--oc-docx-bg)',
  [EVIDENCE_MEDIA_TYPE.DOC]: 'var(--oc-docx-bg)',
  [EVIDENCE_MEDIA_TYPE.XLSX]: 'var(--oc-xlsx-bg)',
  [EVIDENCE_MEDIA_TYPE.CSV]: 'var(--oc-xlsx-bg)',
  [EVIDENCE_MEDIA_TYPE.PPTX]: 'var(--oc-pptx-bg)',
};

const DEFAULT_EVIDENCE_FILE_BACKGROUND = 'var(--oc-default-file-bg)';

export function getEvidenceFileBackground(type?: string): string {
  return EVIDENCE_FILE_TYPE_BACKGROUNDS[type?.toUpperCase() || ''] || DEFAULT_EVIDENCE_FILE_BACKGROUND;
}

export interface ProgramOutcomeData {
  layerKey?: OutcomesLayerKey;
  title?: string;
  subtitle?: string;
  infoLabel?: string;
  cardVariant?: 'outcome' | 'partner';
  outcomes?: ProgramOutcomeCard[];
  evidences?: ProgramEvidenceResource[];
  layers?: Partial<Record<OutcomesLayerKey, ProgramOutcomeData>> | ProgramOutcomeData[];
  outcomesByLayer?: Partial<Record<OutcomesLayerKey, ProgramOutcomeCard[]>>;
  evidencesByLayer?: Partial<Record<OutcomesLayerKey, ProgramEvidenceResource[]>>;
}

export interface OutcomesAriaLabels {
  diagram: string;
  learner: string;
  school: string;
  community: string;
  society: string;
  system: string;
  network: string;
  layerTiles: string;
  narrativeFilters: string;
  frameworkFilters: string;
  cardPages: string;
  prevCards: string;
  nextCards: string;
  prevEvidence: string;
  nextEvidence: string;
  viewEvidence: string;
  closeModal: string;
}

export interface OutcomesModelConfig {
  layerHeading: string;
  title: string;
  description: string;
  layerFootnote: string;
  chipFootnote: string;
  defaultLayer: OutcomesLayerKey;
  programChipLabel: string;
  programColor: string;
  layers: OutcomesLayerConfig[];
  frameworkHeading: string;
  frameworkTitle: string;
  frameworkLead: string;
  evidenceHeading: string;
  programChipFootnote: string;
  defaultNarrativeBody: string;
  defaultCtaLabel: string;
  defaultPartnerImage: string;
  defaultCardLabelPrefix: string;
  ctaIcon: string;
  ariaLabels: OutcomesAriaLabels;
  staticTexts?: {
    programModeHeading?: string;
    programModeDescription?: string;
    diagramNotePrefix?: string;
    chipNotePrefix?: string;
    evidenceCountLabel?: string;
    infoModalTitlePrefix?: string;
    infoModalDescriptionPrefix?: string;
    evidenceNameFallbackSuffix?: string;
  };
}

export const EMPTY_ARIA_LABELS: OutcomesAriaLabels = {
  diagram: '',
  learner: '',
  school: '',
  community: '',
  society: '',
  system: '',
  network: '',
  layerTiles: '',
  narrativeFilters: '',
  frameworkFilters: '',
  cardPages: '',
  prevCards: '',
  nextCards: '',
  prevEvidence: '',
  nextEvidence: '',
  viewEvidence: '',
  closeModal: '',
};

// Placeholder shown only for the brief window before the API config resolves (or if it fails).
export const EMPTY_OUTCOMES_MODEL_CONFIG: OutcomesModelConfig = {
  layerHeading: '',
  title: '',
  description: '',
  layerFootnote: '',
  chipFootnote: '',
  defaultLayer: 'students',
  programChipLabel: '',
  programColor: '',
  layers: [],
  frameworkHeading: '',
  frameworkTitle: '',
  frameworkLead: '',
  evidenceHeading: '',
  programChipFootnote: '',
  defaultNarrativeBody: '',
  defaultCtaLabel: '',
  defaultPartnerImage: '',
  defaultCardLabelPrefix: '',
  ctaIcon: '',
  ariaLabels: EMPTY_ARIA_LABELS,
};

export const EMPTY_LAYER: OutcomesLayerConfig = {
  key: 'students',
  chipLabel: '',
  diagramLabel: '',
  icon: '',
  color: '',
  fill: '',
  diagram: {
    shape: 'full',
    innerRadius: 0,
    outerRadius: 0,
    labelX: 0,
    labelY: 0,
    iconX: 0,
    iconY: 0,
    icon: { type: 'image', value: '' },
  },
  panelType: 'list',
  imgPath: '',
};

export function isValidOutcomesModelConfig(data: any): data is OutcomesModelConfig {
  return (
    !!data &&
    Array.isArray(data.layers) &&
    data.layers.every(
      (layer: any) =>
        !!layer &&
        typeof layer.key === 'string' &&
        typeof layer.diagramLabel === 'string' &&
        typeof layer.color === 'string' &&
        typeof layer.fill === 'string' &&
        !!layer.diagram
    )
  );
}

// Maps the API's `framework[].impact_layer` label to the diagram's layer key.
// The API text is not fully stable, so normalize common spelling/plural variants
// before matching (e.g. Centre/Center, Anganwadi/Anganavadi, "&"/"and").
const IMPACT_LAYER_KEY_MAP: Record<string, OutcomesLayerKey> = {
  'learners outcomes': 'students',
  'learner outcomes': 'students',
  learners: 'students',
  students: 'students',
  'schools anganwadi centres': 'schools',
  'schools anganwadi centers': 'schools',
  'school anganwadi centre': 'schools',
  'school anganwadi center': 'schools',
  schools: 'schools',
  school: 'schools',
  community: 'community',
  communities: 'community',
  'system institutions': 'system',
  system: 'system',
};

function normalizeImpactLayerLabel(label?: string): string {
  return (label || '')
    .toLowerCase()
    .replace(/anganavadi/g, 'anganwadi')
    .replace(/centers/g, 'centres')
    .replace(/center/g, 'centre')
    .replace(/&/g, ' and ')
    .replace(/\band\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function getImpactLayerKey(impactLayer: any): OutcomesLayerKey | undefined {
  const explicitLayerKey = impactLayer?.layerKey as OutcomesLayerKey | undefined;
  if (explicitLayerKey) return explicitLayerKey;

  const normalizedLabel = normalizeImpactLayerLabel(impactLayer?.impact_layer);
  if (IMPACT_LAYER_KEY_MAP[normalizedLabel]) return IMPACT_LAYER_KEY_MAP[normalizedLabel];

  if (normalizedLabel.includes('anganwadi') || normalizedLabel.includes('school')) return 'schools';
  if (normalizedLabel.includes('communit')) return 'community';
  if (normalizedLabel.includes('system')) return 'system';
  if (normalizedLabel.includes('learner') || normalizedLabel.includes('student')) return 'students';

  return undefined;
}

const PROGRAM_OUTCOME_BASE_LAYER_KEY: OutcomesLayerKey = 'students';

// Reshapes one impact_layer entry's outcome cards. The live API currently nests these
// under `frameworks[].details[]` (label = framework_name); a flat `cards[]` (label/description
// per card) is also supported in case the API moves to that shape.
function extractOutcomeCards(impactLayer: any): ProgramOutcomeCard[] {
  if (Array.isArray(impactLayer.cards)) {
    return impactLayer.cards.map((card: any) => ({
      label: card?.label,
      description: card?.description,
    }));
  }

  const outcomes: ProgramOutcomeCard[] = [];
  for (const fw of impactLayer.frameworks || []) {
    for (const detail of fw.details || []) {
      if (detail?.description) {
        outcomes.push({ label: fw.framework_name, description: detail.description });
      }
    }
  }
  return outcomes;
}

// Reshapes one impact_layer entry's evidence resources. The live API currently nests these
// under `frameworks[].details[].evidence_link` (no file metadata, just a Drive link); a flat
// `evidences[]` carrying evidence_name/evidence_size/evidence_type is also supported.
function extractEvidences(impactLayer: any): ProgramEvidenceResource[] {
  if (Array.isArray(impactLayer.evidences)) {
    return impactLayer.evidences.map((evidence: any) => ({
      evidence_name: evidence?.evidence_name,
      evidence_size_bytes: evidence?.evidence_size_bytes,
      evidence_size: evidence?.evidence_size,
      evidence_mime_type: evidence?.evidence_mime_type,
      evidence_type: evidence?.evidence_type,
      tag: evidence?.tag,
      url: evidence?.url,
    }));
  }

  const evidences: ProgramEvidenceResource[] = [];
  for (const fw of impactLayer.frameworks || []) {
    for (const detail of fw.details || []) {
      if (detail?.evidence_link) {
        evidences.push({
          evidence_name: fw.framework_name,
          tag: fw.framework_name,
          evidence_type: 'PDF',
          url: detail.evidence_link,
        });
      }
    }
  }
  return evidences;
}

// Reshapes the raw API `framework` array into ProgramOutcomeData: each entry is one impact
// layer. Supports both the live API's nested `frameworks[].details[]` shape and a flatter
// `cards[]`/`evidences[]` shape, in case the API moves to that later.
export function buildProgramOutcomeDataFromFramework(framework: any[]): ProgramOutcomeData | undefined {
  if (!Array.isArray(framework) || !framework.length) return undefined;

  const layers: Partial<Record<OutcomesLayerKey, ProgramOutcomeData>> = {};
  let baseLayerData: ProgramOutcomeData | undefined;

  for (const impactLayer of framework) {
    // Prefer the API's own layerKey; fall back to mapping the impact_layer label for older payloads.
    const layerKey = getImpactLayerKey(impactLayer);
    if (!layerKey) continue;

    const outcomes = extractOutcomeCards(impactLayer);
    const evidences = extractEvidences(impactLayer);

    if (!outcomes.length && !evidences.length) continue;

    const layerData: ProgramOutcomeData = { title: impactLayer.impact_layer, outcomes, evidences };

    if (layerKey === PROGRAM_OUTCOME_BASE_LAYER_KEY) {
      baseLayerData = layerData;
    } else {
      layers[layerKey] = layerData;
    }
  }

  if (!baseLayerData && !Object.keys(layers).length) return undefined;

  return {
    layerKey: PROGRAM_OUTCOME_BASE_LAYER_KEY,
    ...baseLayerData,
    layers,
  };
}

export interface OutcomesWebLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface OutcomesWebDot {
  cx: number;
  cy: number;
  r: number;
}

// Coordinates for the decorative "network web" backdrop behind the outer diagram ring.
// Pure static art data — kept here so the component template doesn't carry ~85 lines
// of hardcoded <line>/<circle> markup.
export const OUTCOMES_WEB_BACK_LINES: OutcomesWebLine[] = [
  { x1: 192.6, y1: 109.8, x2: 150.1, y2: 131.5 },
  { x1: 79.7, y1: 289.7, x2: 45.1, y2: 289.3 },
  { x1: 444.9, y1: 501.7, x2: 437.4, y2: 550 },
  { x1: 37.8, y1: 374, x2: 89.7, y2: 351.6 },
  { x1: 477.6, y1: 547.5, x2: 437.4, y2: 550 },
  { x1: 550.4, y1: 422.6, x2: 593.1, y2: 388.3 },
  { x1: 79.7, y1: 289.7, x2: 89.7, y2: 351.6 },
  { x1: 444.9, y1: 501.7, x2: 477.6, y2: 547.5 },
  { x1: 550.4, y1: 422.6, x2: 486.8, y2: 419.7 },
  { x1: 593.1, y1: 388.3, x2: 565.3, y2: 345.5 },
  { x1: 325.2, y1: 80.8, x2: 378.2, y2: 63.4 },
  { x1: 525.9, y1: 507, x2: 477.6, y2: 547.5 },
  { x1: 419.9, y1: 71.4, x2: 378.2, y2: 63.4 },
  { x1: 158.4, y1: 525.9, x2: 201.8, y2: 513.9 },
  { x1: 378.2, y1: 63.4, x2: 365.2, y2: 95.7 },
  { x1: 227, y1: 587.4, x2: 219.8, y2: 548.2 },
  { x1: 325.2, y1: 80.8, x2: 365.2, y2: 95.7 },
  { x1: 419.9, y1: 71.4, x2: 365.2, y2: 95.7 },
  { x1: 489.3, y1: 111, x2: 452.7, y2: 146 },
  { x1: 219.8, y1: 548.2, x2: 201.8, y2: 513.9 },
  { x1: 121.6, y1: 500.6, x2: 158.4, y2: 525.9 },
  { x1: 121.6, y1: 500.6, x2: 83.1, y2: 464.6 },
];

export const OUTCOMES_WEB_BACK_DOTS: OutcomesWebDot[] = [
  { cx: 444.9, cy: 501.7, r: 2.0 },
  { cx: 550.4, cy: 422.6, r: 2.0 },
  { cx: 121.6, cy: 500.6, r: 2.0 },
  { cx: 79.7, cy: 289.7, r: 2.0 },
  { cx: 486.8, cy: 419.7, r: 2.0 },
  { cx: 419.9, cy: 71.4, r: 2.0 },
  { cx: 83.1, cy: 464.6, r: 2.0 },
  { cx: 593.1, cy: 388.3, r: 2.0 },
  { cx: 227, cy: 587.4, r: 2.0 },
  { cx: 219.8, cy: 548.2, r: 2.0 },
  { cx: 208.3, cy: 23.7, r: 2.0 },
  { cx: 489.3, cy: 111, r: 2.0 },
  { cx: 525.9, cy: 507, r: 2.0 },
  { cx: 192.6, cy: 109.8, r: 2.0 },
  { cx: 37.8, cy: 374, r: 2.0 },
  { cx: 89.7, cy: 351.6, r: 2.0 },
  { cx: 325.2, cy: 80.8, r: 2.0 },
  { cx: 477.6, cy: 547.5, r: 2.0 },
  { cx: 150.1, cy: 131.5, r: 2.0 },
  { cx: 452.7, cy: 146, r: 2.0 },
  { cx: 565.3, cy: 345.5, r: 2.0 },
  { cx: 378.2, cy: 63.4, r: 2.0 },
  { cx: 437.4, cy: 550, r: 2.0 },
  { cx: 131.4, cy: 44.1, r: 2.0 },
  { cx: 60.7, cy: 224.5, r: 2.0 },
  { cx: 365.2, cy: 95.7, r: 2.0 },
  { cx: 158.4, cy: 525.9, r: 2.0 },
  { cx: 201.8, cy: 513.9, r: 2.0 },
  { cx: 319.4, cy: 567, r: 2.0 },
  { cx: 45.1, cy: 289.3, r: 2.0 },
];

export const OUTCOMES_WEB_FRONT_LINES: OutcomesWebLine[] = [
  { x1: 84, y1: 300, x2: 148, y2: 300 },
  { x1: 452, y1: 300, x2: 516, y2: 300 },
  { x1: 150, y1: 132, x2: 234, y2: 89 },
  { x1: 366, y1: 68, x2: 452, y2: 146 },
  { x1: 452, y1: 146, x2: 516, y2: 300 },
  { x1: 516, y1: 300, x2: 461, y2: 424 },
  { x1: 461, y1: 424, x2: 366, y2: 532 },
  { x1: 366, y1: 532, x2: 234, y2: 511 },
  { x1: 234, y1: 511, x2: 139, y2: 424 },
  { x1: 139, y1: 424, x2: 84, y2: 300 },
  { x1: 150, y1: 132, x2: 84, y2: 300 },
];

export const OUTCOMES_WEB_FRONT_DOTS: OutcomesWebDot[] = [
  { cx: 150, cy: 132, r: 3 },
  { cx: 234, cy: 89, r: 2.4 },
  { cx: 366, cy: 68, r: 2.4 },
  { cx: 452, cy: 146, r: 3 },
  { cx: 516, cy: 300, r: 3 },
  { cx: 461, cy: 424, r: 2.4 },
  { cx: 366, cy: 532, r: 2.4 },
  { cx: 234, cy: 511, r: 2.4 },
  { cx: 139, cy: 424, r: 2.4 },
  { cx: 84, cy: 300, r: 3 },
];

export interface OutcomesGlowStop {
  offset: string;
  opacity: number;
}

export interface OutcomesMaskStop {
  offset: string;
  colorVar: string;
}

// Same stop shape for the neutral "rest" glow and the accent "active" glow — only the
// color differs at render time (bound via cssVar in the template), so one interface covers both.
export const OUTCOMES_REST_GLOW_STOPS: OutcomesGlowStop[] = [
  { offset: '0%', opacity: 0.42 },
  { offset: '50%', opacity: 0.28 },
  { offset: '80%', opacity: 0.13 },
  { offset: '100%', opacity: 0 },
];

export const OUTCOMES_ACTIVE_GLOW_STOPS: OutcomesGlowStop[] = [
  { offset: '0%', opacity: 0.34 },
  { offset: '52%', opacity: 0.24 },
  { offset: '80%', opacity: 0.12 },
  { offset: '100%', opacity: 0 },
];

// The outer-ring edge-fade mask: black (fully masked) -> white (fully visible) -> grey ramp back to black.
export const OUTCOMES_MASK_GRADIENT_STOPS: OutcomesMaskStop[] = [
  { offset: '0%', colorVar: '--oc-black' },
  { offset: '55%', colorVar: '--oc-black' },
  { offset: '61%', colorVar: '--oc-white' },
  { offset: '70%', colorVar: '--oc-diagram-grey-light' },
  { offset: '78%', colorVar: '--oc-diagram-grey-mid' },
  { offset: '86%', colorVar: '--oc-diagram-grey-dark' },
  { offset: '94%', colorVar: '--oc-black' },
  { offset: '100%', colorVar: '--oc-black' },
];
