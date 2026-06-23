import { environment } from "@/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ShareService } from "./shared.service";
import { API_ENDPOINTS } from "../config/api-endpoints";
import { DropdownParamter } from "../models/setup.model";
import { CardParameter } from "../models/dashboard.model";

@Injectable({
    providedIn: 'root'
})
export class RecordReportService{
private readonly STORAGE_KEY = 'user_info';
    private baseUrl = environment.baseurl;
    constructor(
        private http: HttpClient,
        public shareService: ShareService
    ) {}

    onGetWorkerCards(payload:CardParameter){
      return this.shareService.post(API_ENDPOINTS.dashboard.cardstatus,payload)
    }
}