import { environment } from '@/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShareService } from './shared.service';
import { DropdownMaster, DropdownParamter, removeParamter, SubmitSecurity, UpsertWorkerProfileExit, UserInsert, UserType, UserTypeInsert } from '../models/setup.model';
import { API_ENDPOINTS } from '../config/api-endpoints';

@Injectable({
    providedIn: 'root'
})
export class SetupMaintainceService {
    private readonly STORAGE_KEY = 'user_info';
    private baseUrl = environment.baseurl;
    constructor(
        private http: HttpClient,
        public shareService: ShareService
    ) {}

    onDropdownDetails(payload: DropdownParamter) {
        return this.shareService.post(API_ENDPOINTS.setup.getdropdowndetails, payload);
    }

    onDropdownDetailsPublic(payload: DropdownParamter) {
        return this.shareService.post(API_ENDPOINTS.setup.getparameterbased, payload);
    }

    onDeleteData(payload: removeParamter) {
        return this.shareService.post(API_ENDPOINTS.setup.removedataparameter, payload);
    }

    onGetDropdownMaster(payload: DropdownMaster, ddType: string, ddValue: string | null, companyId: string) {
        return this.shareService.getParamter(API_ENDPOINTS.setup.getdropdownmaster, ddType, ddValue, companyId);
    }

    onUserTypeList(payload: UserType) {
        return this.shareService.post(API_ENDPOINTS.setup.getusertypedetail,payload);
    }
    onUserTypeInsert(payload: UserTypeInsert) {
        return this.shareService.post(API_ENDPOINTS.setup.getusertypeinsert, payload);
    }

    onGetUser(payload: UserType) {
        return this.shareService.post(API_ENDPOINTS.setup.getuserdetail, payload);
    }

    onUserInsert(payload: UserInsert) {
        return this.shareService.post(API_ENDPOINTS.setup.getuserdetailinsert, payload);
    }

    onSubmitSecurity(payload: SubmitSecurity) {
        return this.shareService.post(API_ENDPOINTS.setup.submitusersecurity, payload);
    }

    upsertWorkerProfileExit(payload: UpsertWorkerProfileExit){
        return this.shareService.post(API_ENDPOINTS.setup.upsertworkerprofileexit, payload);
    }
    
}
