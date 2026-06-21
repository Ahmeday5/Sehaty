import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SendNotificationPayload } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(ApiService);

  send(payload: SendNotificationPayload): Observable<string> {
    return this.api.postText('api/Notification/send', payload);
  }
}
