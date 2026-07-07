import { environment } from '@/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShareService } from './shared.service';
import { catchError, Observable, throwError } from 'rxjs';
import { authLogin } from '../models/authmodel/auth.model';
import { API_ENDPOINTS } from '../config/api-endpoints';

@Injectable({
    providedIn: 'root'
})
export class LoginService {
    private readonly TOKEN_KEY = 'app_info';
    private readonly user_info = 'user_info';
    private baseUrl = environment.baseurl;
    constructor(
        private http: HttpClient,
        public shareService: ShareService
    ) {}

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    clearToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.user_info);
    }

    isLoggedBeework(loginBody: authLogin): Observable<authLogin> {
        const url = `${this.baseUrl}${API_ENDPOINTS.users.login}`;
        const headers = new HttpHeaders({
            mobilenumber: loginBody.clientcode,
            password: loginBody.pwd,
            accept: 'application/json'
        });
        return this.http.get<authLogin>(url, { headers });
    }
    isLoggedCm2(loginBody:authLogin):Observable<any>{
        const url = `${this.baseUrl}${API_ENDPOINTS.cm2.login}`;
        const payload = {
            usercode:loginBody.clientcode,
            pwd:loginBody.pwd,
            logintype:''
        }
        return this.http.post<any>(url,payload);
    }
}
