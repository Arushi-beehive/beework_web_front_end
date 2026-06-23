import { environment } from "@/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ShareService } from "./shared.service";
import { API_ENDPOINTS } from "../config/api-endpoints";
import { FundAllocationUpload ,SubmitAttendance } from "../models/fundallocation.model";

@Injectable({
    providedIn:'root'
})
export class FundService{
 private readonly STORAGE_KEY = 'user_info';
    private baseUrl = environment.baseurl;
    constructor(
        private http: HttpClient,
        public shareService: ShareService
    ) {}

    saveFundAllocation(payload: any){
        return this.shareService.post(API_ENDPOINTS.fund.savefundexcel,payload);
    }

    uploadApprovedAmount(payload:FundAllocationUpload[], username:string){
        return this.shareService.post(API_ENDPOINTS.fund.uploadApprovedAmount, {uploadData:payload, updatedBy:username});
    }

    onSubmitAttendance(payload: SubmitAttendance) {
        return this.shareService.post(API_ENDPOINTS.setup.submitbulkattendance, payload);
    }
}