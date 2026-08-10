export interface ProjectModel {
    companyId: string;
    projectId: number;
    projectName: string;
    location: string;
    deliveryLocation: string;
    isActive: string;
    userId: number;
    projectOrdinates: string;
    projectRange:number | null;
    projectInchargeId: number;
    adminCharges:number;
    staffJson: StaffModel[];
}

export interface MobileOption {
    userid: number;
    fullname: string;
    mobileno: string;
}

export interface StaffModel {
    userid: number;
}

export interface TowerModel {
    actionType: string;
    towerId: number;
    projectId: number;
    towerName: string;
    towerInchargeId: number;
    isActive: 'Y' | 'N';
    userId: number;
}

export interface RuleModel {
    rule_id: number;
    rule_name: string;
}

export interface RuleDetails {
    companyId: string;
    ruleId: number;
    ruleCreationId: number;
    levels: Levels[];
    created: number;
}

export interface Levels {
    level_no: number;
    profile_id: number;
}
