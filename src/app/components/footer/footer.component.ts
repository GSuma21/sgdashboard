import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  BASE_URL = 'https://shikshagraha.org';

  JOIN_MOVEMENT_FORM_LINK =
    'https://docs.google.com/forms/d/e/1FAIpQLSfSX2bzdJzPBOlstfGg7vWqPFaS5weLnPpwIieR1DBdRgepPg/viewform';

  footerText = {
    tagline:
      "Every step towards education. A people's movement to strengthen India's 1 million public schools so every child can learn well and be ready for the future.",
    movementHeading: 'MOVEMENT',
    connectHeading: 'CONNECT',
    joinMovement: 'Join the Movement',
    copyright: '© 2026 Shikshagraha. All rights reserved.',
    address:
      '4th Floor, Sumo Sapphire, Outer Ring Road, KR Layout, J.P. Nagar, Bengaluru - 560078.'
  };

  movementLinks = [
    { label: 'Home', href: this.BASE_URL },
    { label: 'About Us', href: `${this.BASE_URL}/about-us` },
    { label: 'Impact', href: 'https://dashboard.shikshagraha.org/' },
    {
      label: 'Samvaad',
      href: `${this.BASE_URL}/media-update/shiksha-samvaad-ignites-national-momentum-for-improving-indias-public-education-system`
    },
    { label: 'Awards', href: `${this.BASE_URL}/awards` },
    { label: 'Commons', href: 'https://commons.shikshagraha.org/' },
    { label: 'Media', href: `${this.BASE_URL}/story-archive` }
  ];

  connectLinks = [
    { label: 'Our Partners', href: `${this.BASE_URL}/#partners` },
    { label: 'FAQs', href: '#' },
    {
      label: 'hello@shikshagraha.org',
      href: 'mailto:hello@shikshagraha.org'
    }
  ];

  socialLinks = [
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

}
