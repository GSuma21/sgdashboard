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
  cta?: {
    label: string;
    link: string;
  };
  frameworkCta?: {
    label: string;
    link: string;
  };
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
  title: string;
  type: string;
  size: string;
  tag: string;
  url?: string;
}

export interface ProgramOutcomeData {
  layerKey?: OutcomesLayerKey;
  title?: string;
  subtitle?: string;
  infoLabel?: string;
  cardVariant?: 'outcome' | 'partner';
  cards?: ProgramOutcomeCard[];
  evidences?: ProgramEvidenceResource[];
  layers?: Partial<Record<OutcomesLayerKey, ProgramOutcomeData>> | ProgramOutcomeData[];
  cardsByLayer?: Partial<Record<OutcomesLayerKey, ProgramOutcomeCard[]>>;
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
  };
}

// OUTCOMES_MODEL_CONFIG is now fetched from the API (outcomes-model-config.json) in OutcomesModelComponent.
// Kept here commented out for reference only — not used at runtime.
/*
export const OUTCOMES_MODEL_CONFIG: OutcomesModelConfig = {
  layerHeading: 'Impact Narrative',
  title: 'What Shapes Student Outcomes',
  description: "A learner's education is shaped across multiple layers:",
  layerFootnote: 'Click on any of the above Layer to read more about it.',
  chipFootnote: 'Click on any of the above quick chip to read more about it.',
  defaultLayer: 'students',
  programChipLabel: 'Learner Outcomes:',
  programColor: '#ff9911',

  frameworkHeading: 'Impact Framework',
  frameworkTitle: 'Measuring Impact Across Layers',
  frameworkLead:
    'The Shikshagraha movement measures impact across these interconnected layers, each a level through which micro-improvements contribute to systemic transformation.',
  evidenceHeading: 'Evidences and Resources',
  programChipFootnote: '* Click on any of the above tile to read more about it.',
  defaultNarrativeBody: 'Tap a layer to see what it means.',
  defaultCtaLabel: 'Know more',
  defaultPartnerImage: 'assets/partners/default-partner.svg',
  defaultCardLabelPrefix: 'Card ',
  ctaIcon: 'north_east',

  staticTexts: {
    programModeHeading: 'Program Details',
    programModeDescription: 'View program outcomes and evidence',
    diagramNotePrefix: '* ',
    chipNotePrefix: '* ',
    evidenceCountLabel: 'Evidences and Resources',
    infoModalTitlePrefix: 'About',
    infoModalDescriptionPrefix: 'Information about',
  },

  ariaLabels: {
    diagram: 'Outcome layers',
    learner: 'Learner',
    school: 'School and Anganwadi',
    community: 'Community',
    society: 'Society',
    system: 'System Institutions',
    network: 'Network',
    layerTiles: 'Outcome layer tiles',
    narrativeFilters: 'Outcome narrative layer filters',
    frameworkFilters: 'Outcome framework layer filters',
    cardPages: 'Card pages',
    prevCards: 'Show previous cards',
    nextCards: 'Show next cards',
    prevEvidence: 'Show previous evidences',
    nextEvidence: 'Show next evidences',
    viewEvidence: 'View evidence',
    closeModal: 'Close',
  },

  layers: [
    {
      key: 'students',
      chipLabel: 'Learner',
      diagramLabel: 'Learner',
      icon: 'child_care',
      color: '#ff9911',
      fill: '#fff3e2',
      diagram: {
        shape: 'full',
        innerRadius: 0,
        outerRadius: 58,
        labelX: 300,
        labelY: 300,
        labelLayout: 'icon-only',
        labelAnchor: 'middle',
        iconX: 275,
        iconY: 275,
        dataLayerAttr: 'learner',
        icon: {
          type: 'material',
          value: 'assets/icons/learner.svg',
          color: '#ff9911',
          width: 50,
          height: 34,
        },
        text: {
          x: 300,
          y: 325,
          fill: '#1a1622',
          fontSize: 23,
          fontWeight: 600,
        },
      },
      panelType: 'list',
      imgPath: 'assets/icons/student.svg',
      heading: 'Learners Outcomes',
      subheading:
        "Measures whether children are experiencing improved learning outcomes through better access, learning, well-being, aspirations, and future readiness.",
      body:
        'The learner at the centre — their learning, well-being and aspirations are what every layer works toward.',
      listItems: [
        {
          letter: 'E',
          icon: 'fact_check',
          title: 'Enrollment',
          description: 'Are more children accessing public education?',
        },
        {
          letter: 'R',
          icon: 'accessibility_new',
          title: 'Retention',
          description: 'Are children consistently attending and remaining in school?',
        },
        {
          letter: 'L',
          icon: 'menu_book',
          title: 'Learning',
          description:
            'Are children demonstrating improved academic and holistic learning outcomes along with future ready skills?',
        },
        {
          letter: 'A',
          icon: 'star',
          title: 'Aspiration and agency',
          description:
            'Are children developing confidence, future aspirations, and awareness of opportunities?',
        },
        {
          letter: 'W',
          icon: 'favorite_border',
          title: 'Well-being',
          description:
            'Are children experiencing emotional, physical, and social well-being in school?',
        },
      ],
    },
    {
      key: 'schools',
      chipLabel: 'School & Anganwadi Centres',
      diagramLabel: 'School & Anganwadi',
      icon: 'account_balance',
      color: '#5b6ee0',
      fill: '#eff0fc',
      diagram: {
        shape: 'bottom',
        innerRadius: 58,
        outerRadius: 152,
        labelX: 300,
        labelY: 402,
        labelLayout: 'stacked',
        labelAnchor: 'middle',
        iconOffsetY: -18,
        textOffsetY: 20,
        iconX: 277,
        iconY: 366,
        curvedLabelPath: 'M167.43,341.80 A139,139 0 0 0 432.57,341.80',
        labelForAttr: 'school & anganwadi',
        icon: {
          type: 'material',
          value: 'assets/icons/school.svg',
          color: '#5b6ee0',
          width: 50,
          height: 34,
        },
        text: {
          x: 300,
          y: 402,
          fill: '#1a1622',
          fontSize: 23,
          fontWeight: 600,
        },
      },
      panelType: 'list',
      imgPath: 'assets/icons/school-solid.svg',
      heading: 'Schools and Anganwadi Improvement',
      subheading:
        'Measuring how learning environments, teaching practices, school leadership, and community participation',
      body:
        'Schools and anganwadi centres — where teaching happens and children spend most of their day. (placeholder definition)',
      listItems: [
        {
          letter: 'L',
          icon: 'workspace_premium',
          title: 'Leadership',
          description: 'Are school and Anganwadi leaders driving continuous improvements?',
        },
        {
          letter: 'E',
          icon: 'menu_book',
          title: 'Enabling learning environment',
          description:
            'Do schools and Anganwadi centres provide a safe, inclusive, and well-resourced environment that enables children to learn?',
        },
        {
          letter: 'E',
          icon: 'co_present',
          title: 'Effective teaching and learning practices',
          description:
            'Are teaching and learning practices engaging, inclusive, and responsive to the diverse learning needs of children?',
        },
      ],
    },
    {
      key: 'community',
      chipLabel: 'Community',
      diagramLabel: 'Community',
      icon: 'group',
      color: '#e0338a',
      fill: '#fcebf3',
      diagram: {
        shape: 'top',
        innerRadius: 58,
        outerRadius: 152,
        labelX: 300,
        labelY: 198,
        labelLayout: 'stacked',
        labelAnchor: 'middle',
        iconOffsetY: -18,
        textOffsetY: 22,
        iconX: 277,
        iconY: 188,
        curvedLabelPath: 'M219.82,209.38 A121,121 0 0 1 380.18,209.38',
        icon: {
          type: 'material',
          value: 'assets/icons/community.svg',
          color: '#e0338a',
          width: 50,
          height: 34,
        },
        text: {
          x: 300,
          y: 198,
          fill: '#1a1622',
          fontSize: 23,
          fontWeight: 600,
        },
      },
      panelType: 'story',
      imgPath: 'assets/icons/community-group.svg',
      eyebrow: 'Community',
      heading: 'Community',
      subheading:
        'Measures whether communities are actively supporting education through leadership, participation, and positive perceptions of public schools.',
      body: 'Families and local networks that support and demand good education for their children. (placeholder definition)',
      listItems: [
        {
          letter: 'P',
          icon: 'groups',
          title: 'Parents and community participation and perception',
          description:
            "Are parents and communities actively engaged in supporting schools and children's learning?",
        },
        {
          letter: 'L',
          icon: 'workspace_premium',
          title: 'Leadership',
          description:
            'Are community leaders continuously identifying, implementing, and sustaining improvements in their contexts?',
        },
      ],
    },
    {
      key: 'society',
      chipLabel: 'Society',
      diagramLabel: 'Society',
      icon: 'diversity_3',
      color: '#99459a',
      fill: '#f2e7f2',
      diagram: {
        shape: 'top',
        innerRadius: 152,
        outerRadius: 216,
        labelX: 300,
        labelY: 118,
        labelLayout: 'inline',
        labelAnchor: 'start',
        textOffsetX: 34,
        textOffsetY: 4,
        iconX: 235,
        iconY: 100,
        curvedLabelPath: 'M233.70,127.29 A185,185 0 0 1 366.30,127.29',
        icon: {
          type: 'material',
          value: 'assets/icons/society.svg',
          color: '#99459a',
          width: 34,
          height: 34,
        },
        text: {
          x: 300,
          y: 118,
          fill: '#1a1622',
          fontSize: 23,
          fontWeight: 600,
        },
      },
      panelType: 'story',
      imgPath: '',
      eyebrow: 'Society',
      body: 'The broader social norms and structures that surround the community. (placeholder definition)',
      frameworkNote: 'Framework being defined.',
      cta: {
        label: 'Explore Voices on the Ground',
        link: '/voices-from-the-ground',
      },
      frameworkCta: {
        label: 'Explore Voices from the Ground',
        link: '/voices-from-the-ground',
      },
    },
    {
      key: 'system',
      chipLabel: 'System Institutions',
      diagramLabel: 'System Institutions',
      icon: 'article',
      color: '#562f91',
      fill: '#e9e4f1',
      diagram: {
        shape: 'bottom',
        innerRadius: 152,
        outerRadius: 216,
        labelX: 300,
        labelY: 482,
        labelLayout: 'inline',
        labelAnchor: 'start',
        textOffsetX: 34,
        textOffsetY: 4,
        iconX: 195,
        iconY: 460,
        curvedLabelPath: 'M138.95,423.58 A203,203 0 0 0 461.05,423.58',
        labelForAttr: 'system institutions',
        icon: {
          type: 'material',
          value: 'assets/icons/system-institutions.svg',
          color: '#562f91',
          width: 34,
          height: 34,
        },
        text: {
          x: 300,
          y: 482,
          fill: '#1a1622',
          fontSize: 23,
          fontWeight: 600,
        },
      },
      panelType: 'list',
      imgPath: '',
      eyebrow: 'System Institutions',
      subheading: 'Placeholder Header',
      body: 'The governance, policy and institutions that enable and resource education. (placeholder definition)',
      listItems: [
        {
          letter: 'B',
          icon: 'account_balance_wallet',
          title: 'Budget allocation and resource mobilization',
          description:
            'Are institutions effectively mobilising and utilising resources to strengthen education outcomes?',
        },
        {
          letter: 'R',
          icon: 'rate_review',
          title: 'Review, monitoring and feedback',
          description:
            'Are institutions continuously reviewing progress, learning from evidence, and adapting their actions?',
        },
        {
          letter: 'I',
          icon: 'emoji_objects',
          title: 'Innovation and new projects',
          description:
            'Are institutions fostering innovation by initiating, experimenting, and scaling what works?',
        },
        {
          letter: 'C',
          icon: 'hub',
          title: 'Co-creation with diverse stakeholders',
          description:
            'Are institutions meaningfully collaborating with communities, schools, CSOs, and other stakeholders to design and implement improvement programmes?',
        },
      ],
    },
    {
      key: 'network',
      chipLabel: 'Network',
      diagramLabel: 'Network',
      icon: 'public',
      color: '#961c00',
      fill: '#f3e5df',
      diagram: {
        shape: 'full',
        innerRadius: 216,
        outerRadius: 304,
        labelX: 300,
        labelY: 58,
        labelLayout: 'inline',
        labelAnchor: 'start',
        textOffsetX: 34,
        textOffsetY: 4,
        iconX: 215,
        iconY: 45,
        hitRadius: 344,
        isHitTarget: true,
        icon: {
          type: 'material',
          value: 'assets/icons/network.svg',
          color: '#961c00',
          width: 34,
          height: 34,
        },
        text: {
          x: 300,
          y: 58,
          fill: '#1a1622',
          fontSize: 23,
          fontWeight: 600,
        },
      },
      imgPath: 'assets/icons/network-users.svg',
      panelType: 'story',
      eyebrow: 'Network',
      heading: 'Network',
      subheading: 'Network Placeholder',
      body: 'The wider web of actors and movements connecting everything. (placeholder definition)',
      frameworkNote: 'Framework being defined.',
      cta: {
        label: 'Explore Network Health',
        link: '/network-health',
      },
      frameworkCta: {
        label: 'Explore Network Health',
        link: '/network-health',
      },
    },
  ],
};
*/

export const SAMPLE_PROGRAM_OUTCOME_DATA: ProgramOutcomeData = {
  layerKey: 'students',
  infoLabel: 'Learner outcome program details',
  cards: [
    {
      label: 'Enrollment',
      description:
        '75% of upper primary schools will participate in Project Based Learning lesson plans for Science & Math.',
    },
    {
      label: 'Retention',
      description:
        '60% of schools will effectively implement PBL as pedagogy in their Maths, Science Classes.',
    },
    {
      label: 'Learning',
      description:
        '10% of improvement will be shown from baseline to endline in academic achievement and 21st century skills.',
    },
    {
      label: 'Enrollment',
      description:
        '75% of upper primary schools will participate in Project Based Learning lesson plans for Science & Math.',
    },
    {
      label: 'Retention',
      description:
        '60% of schools will effectively implement PBL as pedagogy in their Maths, Science Classes.',
    },
    {
      label: 'Learning',
      description:
        '10% of improvement will be shown from baseline to endline in academic achievement and 21st century skills.',
    },
    {
      label: 'Enrollment',
      description:
        '75% of upper primary schools will participate in Project Based Learning lesson plans for Science & Math.',
    },
    {
      label: 'Retention',
      description:
        '60% of schools will effectively implement PBL as pedagogy in their Maths, Science Classes.',
    },
    {
      label: 'Learning',
      description:
        '10% of improvement will be shown from baseline to endline in academic achievement and 21st century skills.',
    },
  ],
  evidences: [
    {
      title: 'Enrollment.pdf',
      type: 'PDF',
      size: '3.6MB',
      tag: 'Enrollment',
      url: 'https://docs.google.com/document/d/1yGlp_p4CaV902lRhznRk2ldtc25HYB4HMPtoBGDOSIc/edit?tab=t.0',
    },
    {
      title: 'Evaluation.pdf',
      type: 'PDF',
      size: '3.6MB',
      tag: 'Retention',
      url: 'https://docs.google.com/document/d/1yGlp_p4CaV902lRhznRk2ldtc25HYB4HMPtoBGDOSIc/edit?tab=t.0',
    },
    {
      title: 'Enrollment.pdf',
      type: 'PDF',
      size: '3.6MB',
      tag: 'Enrollment',
      url: 'https://docs.google.com/document/d/1yGlp_p4CaV902lRhznRk2ldtc25HYB4HMPtoBGDOSIc/edit?tab=t.0',
    },
    {
      title: 'Evaluation.pdf',
      type: 'PDF',
      size: '3.6MB',
      tag: 'Retention',
      url: 'https://docs.google.com/document/d/1yGlp_p4CaV902lRhznRk2ldtc25HYB4HMPtoBGDOSIc/edit?tab=t.0',
    },
    {
      title: 'Enrollment.pdf',
      type: 'PDF',
      size: '3.6MB',
      tag: 'Enrollment',
      url: 'https://docs.google.com/document/d/1yGlp_p4CaV902lRhznRk2ldtc25HYB4HMPtoBGDOSIc/edit?tab=t.0',
    },
    {
      title: 'Evaluation.pdf',
      type: 'PDF',
      size: '3.6MB',
      tag: 'Retention',
      url: 'https://docs.google.com/document/d/1yGlp_p4CaV902lRhznRk2ldtc25HYB4HMPtoBGDOSIc/edit?tab=t.0',
    },
  ],
  layers: {
    schools: {
      infoLabel: 'Schools and Anganwadi program details',
      cards: [
        {
          label: 'Leadership',
          description:
            '75% of upper primary schools will participate in Project Based Learning lesson plans for Science & Math.',
        },
      ],
      evidences: [],
    },
    community: {
      infoLabel: 'Community program details',
      cards: [
        {
          label: 'Parents and community participation and perception',
          description:
            '75% of upper primary schools will participate in Project Based Learning lesson plans for Science & Math.',
        },
        {
          label: 'Leadership',
          description:
            '60% of schools will effectively implement PBL as pedagogy in their Maths, Science Classes.',
        },
      ],
      evidences: [],
    },
    network: {
      infoLabel: 'Network program details',
      cardVariant: 'partner',
      cards: [
        {
          name: 'NEAID',
          src: 'https://res.cloudinary.com/dfncm107l/image/upload/v1754371500/partners/neaid.png',
          alt: 'NEAID',
          website: 'https://neaid.org/',
        },
        {
          name: 'Mantra',
          src: 'https://drive.google.com/uc?export=view&id=1v1l17-Vx5eKFXnyWzIfrC_lm_Jf_bHkL',
          alt: 'Mantra4Change',
          website: 'https://www.mantra4change.org/',
        },
        {
          name: 'INVOLVE',
          src: 'https://res.cloudinary.com/dfncm107l/image/upload/v1754371479/partners/involve.jpg',
          alt: 'Involve',
          website: 'https://involveedu.com/',
        },
        {
          name: 'EduWeave',
          src: 'https://res.cloudinary.com/dfncm107l/image/upload/v1754371471/partners/eduweave.jpg',
          alt: 'EduWeave',
        },
        {
          name: 'Karunodaya',
          src: 'https://res.cloudinary.com/dfncm107l/image/upload/v1754371487/partners/karunodaya.png',
          alt: 'Karunodaya',
        },
      ],
      evidences: [],
    },
  },
};