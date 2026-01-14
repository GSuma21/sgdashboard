import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private counter = 0;
  private loading$ = new BehaviorSubject<boolean>(false);

  readonly isLoading$ = this.loading$.asObservable();

  show() {
    this.counter++;
    this.loading$.next(true);
  }
  
  hide() {
    this.counter--;
    if (this.counter <= 0) {
      this.counter = 0;
      this.loading$.next(false);
    }
  }
}
