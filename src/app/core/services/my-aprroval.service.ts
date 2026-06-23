import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ShareService } from "./shared.service";
import { ApprovalModel, RequestApprovalModel } from "../models/approval.model";
import { API_ENDPOINTS } from "../config/api-endpoints";

@Injectable({
    providedIn:'root'
})

export class MyApprovalService{
    constructor(
        private http:HttpClient,
        private shareService : ShareService
    ){}

    onGetApprovalSubmit(payload:ApprovalModel){
        return this.shareService.post(API_ENDPOINTS.myapproval.getapprovalsubmit,payload);
    }

    onGetApprovalReject(payload:RequestApprovalModel){
        return this.shareService.post(API_ENDPOINTS.myapproval.getapprovalrequesthaziri,payload);
    }
}