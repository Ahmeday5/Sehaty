import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApplyDiscountPayload, DoctorOption } from '../models/discount.model';

@Injectable({ providedIn: 'root' })
export class DiscountsService {
  private readonly api = inject(ApiService);

  getDoctors(): Observable<DoctorOption[]> {
    return this.api.get<DoctorOption[]>('api/Dashboard/getAllDoctorsIdNameAndSpecialization');
  }

  applyToAppointment(payload: ApplyDiscountPayload): Observable<string> {
    return this.api.postText('api/Dashboard/applyDiscountToAppointment', payload);
  }
}
