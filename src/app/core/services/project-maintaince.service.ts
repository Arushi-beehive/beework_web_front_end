import { environment } from "@/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ShareService } from "./shared.service";
import { ProjectModel, RuleDetails,TowerModel } from "../models/project.model";
import { API_ENDPOINTS } from "../config/api-endpoints";
import { UserType } from "../models/setup.model";

@Injectable({
    providedIn:'root'
})

export class ProjectMaintainceService{
    private baseUrl = environment.baseurl;
    constructor(private http:HttpClient, public sharedService:ShareService){}

    onGetProjectList(payload:UserType){
       return this.sharedService.post(API_ENDPOINTS.project.getprojectlist,payload);
    }

    onProjectUpsert(payload:ProjectModel){
        return this.sharedService.post(API_ENDPOINTS.project.getprojectupsert,payload);
    }

    onGetTowerList(payload:UserType){
        return this.sharedService.post(API_ENDPOINTS.project.gettowerlist,payload);
    }

    onGetTowerUpsert(payload:TowerModel){
        return this.sharedService.post(API_ENDPOINTS.project.gettowerupsert,payload);
    }

    onGetRuleDetails(payload: RuleDetails){
        return this.sharedService.post(API_ENDPOINTS.project.getruledetails,payload);
    }
}