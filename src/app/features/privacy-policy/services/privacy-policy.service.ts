import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PrivacyPolicyService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');

  getPage(pageType: number): Observable<string> {
    return this.http.get(
      `${this.baseUrl}/api/Dashboard/getStaticPage?pageType=${pageType}`,
      { responseType: 'text' },
    );
  }

  updatePage(pageType: number, content: string): Observable<string> {
    return this.http.put(
      `${this.baseUrl}/api/Dashboard/updateStaticPage`,
      { pageType, content },
      { responseType: 'text' },
    );
  }
}
