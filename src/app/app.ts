import { Component, OnInit, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from './core/services/theme';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './pages/dashboard/dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, DashboardComponent],
  template: `
    <header class="app-header">
      <nav class="container">
        <a href="https://shikshagraha.org/" target="_blank" class="logo"><img src='assets/icons/main_logo.svg'></a>

        <button
          class="menu-toggle"
          (click)="toggleMenu()"
          aria-label="Toggle menu"
          [attr.aria-expanded]="isMenuOpen"
          type="button"
        >
          <span *ngIf="!isMenuOpen"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#572e91" class="bi bi-list" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
        </svg></span>
          <span *ngIf="isMenuOpen"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#572e91" class="bi bi-x" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
      </svg></span>
        </button>

        <div class="nav-links" [class.open]="isMenuOpen">
          <a routerLink="/" routerLinkActive="active-link" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/dashboard" routerLinkActive="active-link">Dashboard</a>
          <a routerLink="/network-health" routerLinkActive="active-link">Network Health</a>
        </div>
      </nav>
    </header>
    <main class="app-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  isMenuOpen = false;

  constructor(private themeService: ThemeService) {
    effect(() => {
      document.documentElement.className = `${this.themeService.getTheme()()}-theme`;
    });
  }

  ngOnInit(): void {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleTheme() {
    const currentTheme = this.themeService.getTheme()();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(newTheme);
  }
}
