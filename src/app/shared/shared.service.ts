import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private searchTermSubject = new BehaviorSubject<string>('');
  currentSearchTerm: Observable<string> = this.searchTermSubject.asObservable().pipe(
      debounceTime(300),
      distinctUntilChanged()
  );

  constructor(private router: Router) {
    // Listen to route changes and clear the search term
    this.router.events.pipe(
        filter(event => event instanceof NavigationEnd) // Only react to navigation end events
    ).subscribe(() => {
      this.clearSearchTerm(); // Clear the search term on route change
    });
  }

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

  clearSearchTerm(): void {
    this.searchTermSubject.next(''); // Reset the search term to an empty string
  }
}
