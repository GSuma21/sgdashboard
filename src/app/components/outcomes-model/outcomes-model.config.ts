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

export interface OutcomesModelConfig {
  title: string;
  layerFootnote: string;
  chipFootnote: string;
  defaultLayer: OutcomesLayerKey;
  programChipLabel: string;
  programColor: string;
  layers: OutcomesLayerConfig[];
}

export const OUTCOMES_MODEL_CONFIG: OutcomesModelConfig = {
  title: 'What Shapes Student Outcomes',
  layerFootnote: 'Click on any of the above Layer to read more about it.',
  chipFootnote: 'Click on any of the above quick chip to read more about it.',
  defaultLayer: 'students',
  programChipLabel: 'Learners Outcomes',
  programColor: '#ff9911',
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
        icon: {
          type: 'material',
          value: 'child_care',
          color: '#ff9911',
          width: 34,
          height: 34,
        },
      },
      panelType: 'list',
      heading: 'Learners Outcomes',
      subheading:
        "Measuring improvements in children's enrollment, retention, learning, aspirations, and well-being.",
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
        shape: 'top',
        innerRadius: 58,
        outerRadius: 152,
        labelX: 300,
        labelY: 402,
        labelLayout: 'stacked',
        labelAnchor: 'middle',
        iconOffsetY: -18,
        textOffsetY: 20,
        icon: {
          type: 'material',
          value: 'account_balance',
          color: '#5b6ee0',
          width: 34,
          height: 34,
        },
      },
      panelType: 'list',
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
        shape: 'bottom',
        innerRadius: 58,
        outerRadius: 152,
        labelX: 300,
        labelY: 198,
        labelLayout: 'stacked',
        labelAnchor: 'middle',
        iconOffsetY: -18,
        textOffsetY: 22,
        icon: {
          type: 'material',
          value: 'group',
          color: '#e0338a',
          width: 34,
          height: 34,
        },
      },
      panelType: 'story',
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
            'Are parents and communities actively engaged in supporting schools and children’s learning?',
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
        icon: {
          type: 'material',
          value: 'diversity_3',
          color: '#99459a',
          width: 34,
          height: 34,
        },
      },
      panelType: 'story',
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
        icon: {
          type: 'material',
          value: 'article',
          color: '#562f91',
          width: 34,
          height: 34,
        },
      },
      panelType: 'list',
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
        icon: {
          type: 'material',
          value: 'public',
          color: '#961c00',
          width: 34,
          height: 34,
        },
      },
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
  ],
  evidences: [
    {
      title: 'Enrollment.pdf',
      type: 'PDF',
      size: '3.6MB',
      tag: 'Enrollment',
    },
    {
      title: 'Evaluation.pdf',
      type: 'PDF',
      size: '3.6MB',
      tag: 'Retention',
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
