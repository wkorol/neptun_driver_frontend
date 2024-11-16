import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private searchTermSubject = new BehaviorSubject<string>('');
  currentSearchTerm: Observable<string> = this.searchTermSubject.asObservable().pipe(
      debounceTime(300),
      distinctUntilChanged()
  );

  constructor(private router: Router) {}

  updateSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
    this.navigateBasedOnTerm(term);
  }

  private navigateBasedOnTerm(term: string): void {
    if (term) {
      this.router.navigate(['/hotel']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
