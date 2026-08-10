import { environment } from "@/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ShareService } from "./shared.service";
import { API_ENDPOINTS } from "../config/api-endpoints";
import { FundAllocationUpload ,PaymentGroupLeaderUpload,PaymentWorkerUpload,SubmitAttendance } from "../models/fundallocation.model";

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

    uploadApprovedAmount(companyid: number, payload:FundAllocationUpload[], username:number){
        return this.shareService.post(API_ENDPOINTS.fund.uploadApprovedAmount, {companyId: companyid, uploadData:payload, updatedBy:username});
    }

     uploadPaymentGroupLeader(companyid:number, payload: PaymentGroupLeaderUpload[], username:number){
        return this.shareService.post(API_ENDPOINTS.fund.uploadPaymentGroupLeader, {companyId: companyid, uploadData:payload, updatedBy:username});
    }

    uploadPaymentWorker(companyid:number, payload: PaymentWorkerUpload[], username:number){
        return this.shareService.post(API_ENDPOINTS.fund.uploadPaymentWorker, {companyId: companyid, uploadData:payload, updatedBy:username});
    }

    onSubmitAttendance(payload: SubmitAttendance) {
        return this.shareService.post(API_ENDPOINTS.setup.submitbulkattendance, payload);
    }
}