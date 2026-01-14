import { Injectable } from '@angular/core';
import { LoaderService } from './loader.service';

@Injectable({ providedIn: 'root' })
export class LoaderRunnerService {
  constructor(private loader: LoaderService) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    this.loader.show();
    try {
      return await work();
    } finally {
      this.loader.hide();
    }
  }
}