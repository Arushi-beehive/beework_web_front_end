import { Injectable } from "@angular/core";
import { CompanySubscriptionUpsertParamter, UserHeader } from "../models/profile.model";
import { Observable } from "rxjs";
import { API_ENDPOINTS } from "../config/api-endpoints";
import { ShareService } from "./shared.service";

@Injectable({
     providedIn: 'root'
})
export class CompanyService{
      constructor(
        public shareService: ShareService
    ) {}
upsertCompanyDetails(payload:UserHeader):Observable<any>{
    return this.shareService.post(API_ENDPOINTS.company.upsertcompanydetails,payload);
}

upsertCompanySubscription(payload:CompanySubscriptionUpsertParamter){
    return this.shareService.post(API_ENDPOINTS.company.upsertcompanysubscription,payload);
}
}