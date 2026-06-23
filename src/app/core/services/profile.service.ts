import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShareService } from './shared.service';
import { ChangePasswordModel } from '../models/user.model';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { UserHeader } from '../models/profile.model';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private readonly STORAGE_KEY = 'user_info';
    private baseUrl = environment.baseurl;
    constructor(
        private http: HttpClient,
        public shareService: ShareService
    ) {}

    onChangePasswordUpsert(payload: ChangePasswordModel) {
        return this.shareService.post(API_ENDPOINTS.user.getchangepassword, payload);
    }

  onUserListHeaderCreate(payload: UserHeader): Observable<any> {
    return this.shareService.post(API_ENDPOINTS.user.updateprofie, payload);
}
}
