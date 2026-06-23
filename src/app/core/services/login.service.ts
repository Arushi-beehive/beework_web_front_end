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
        console.log('token', this.TOKEN_KEY);
        return localStorage.getItem(this.TOKEN_KEY);
    }

    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
        console.log('shdhs',token)
    }

    clearToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.user_info);
    }

    isLogged(loginBody: authLogin): Observable<authLogin> {
        const url = `${this.baseUrl}${API_ENDPOINTS.users.login}`;
        const headers = new HttpHeaders({
            mobilenumber: loginBody.clientcode,
            password: loginBody.pwd,
            accept: 'application/json'
        });
        return this.http.get<authLogin>(url, { headers });
    }
}
