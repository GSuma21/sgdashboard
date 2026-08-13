import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FOOTER_CONNECT_LINKS,
  FOOTER_LOGO_URL,
  FOOTER_MOVEMENT_LINKS,
  FOOTER_SOCIAL_LINKS,
  FOOTER_TEXT,
  FooterLink,
  JOIN_MOVEMENT_FORM_LINK
} from '../../../constants/footerConstants';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  JOIN_MOVEMENT_FORM_LINK = JOIN_MOVEMENT_FORM_LINK;

  footerLogoUrl = FOOTER_LOGO_URL;

  footerText = FOOTER_TEXT;

  movementLinks = FOOTER_MOVEMENT_LINKS;

  connectLinks = FOOTER_CONNECT_LINKS;

  socialLinks = FOOTER_SOCIAL_LINKS;

  handleConnectLinkClick(
    event: MouseEvent,
    item: FooterLink
  ): void {
    if (!item.href) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

}