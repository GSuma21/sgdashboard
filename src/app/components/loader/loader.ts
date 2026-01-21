import { Component } from '@angular/core';
import { LoaderService } from '../../services/loader.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './loader.html',
  styleUrls: ['./loader.css'],
  standalone: true
})
export class Loader {
  constructor(public loader: LoaderService) {}
}
