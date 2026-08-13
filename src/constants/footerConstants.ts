const SHIKSHAGRAHA_BASE_URL = 'https://shikshagraha.org';

export interface FooterLink {
  label: string;
  href?: string;
}

export interface FooterSocialLink {
  label: string;
  href: string;
  img: string;
}

export const JOIN_MOVEMENT_FORM_LINK =
  'https://docs.google.com/forms/d/e/1FAIpQLSfSX2bzdJzPBOlstfGg7vWqPFaS5weLnPpwIieR1DBdRgepPg/viewform';

export const FOOTER_LOGO_URL = 'assets/icons/shikshagraha_footer_logo.svg';

export const FOOTER_TEXT = {
  tagline:
    "Every step towards education. A people's movement to strengthen India's 1 million public schools so every child can learn well and be ready for the future.",
  movementHeading: 'MOVEMENT',
  connectHeading: 'CONNECT',
  joinMovement: 'Join the Movement',
  copyright: '© 2026 Shikshagraha. All rights reserved.',
  address:
    '4th Floor, Sumo Sapphire, Outer Ring Road, KR Layout, J.P. Nagar, Bengaluru - 560 078.'
};

export const FOOTER_MOVEMENT_LINKS: FooterLink[] = [
  { label: 'Home', href: SHIKSHAGRAHA_BASE_URL },
  { label: 'About Us', href: `${SHIKSHAGRAHA_BASE_URL}/about-us` },
  { label: 'Impact', href: 'https://dashboard.shikshagraha.org/' },
  {
    label: 'Samvaad',
    href: `${SHIKSHAGRAHA_BASE_URL}/media-update/shiksha-samvaad-ignites-national-momentum-for-improving-indias-public-education-system`
  },
  { label: 'Awards', href: `${SHIKSHAGRAHA_BASE_URL}/awards` },
  { label: 'Commons', href: 'https://commons.shikshagraha.org/' },
  { label: 'Media', href: `${SHIKSHAGRAHA_BASE_URL}/story-archive` }
];

export const FOOTER_CONNECT_LINKS: FooterLink[] = [
  { label: 'Our Partners', href: `${SHIKSHAGRAHA_BASE_URL}/#partners` },
  { label: 'FAQs' },
  {
    label: 'hello@shikshagraha.org',
    href: 'mailto:hello@shikshagraha.org'
  }
];

export const FOOTER_SOCIAL_LINKS: FooterSocialLink[] = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/shikshagraha/',
    img: 'assets/icons/instagram.svg'
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/shikshagraha/',
    img: 'assets/icons/linked_in.svg'
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/shikshagraha',
    img: 'assets/icons/facebook.svg'
  },
  {
    label: 'X',
    href: 'https://x.com/Shikshagraha',
    img: 'assets/icons/twitter.svg'
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@shikshagraha',
    img: 'https://shikshagraha.org/wp-content/uploads/2024/09/youtube-2.png'
  }
];
