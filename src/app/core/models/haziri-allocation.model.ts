export interface HaziriGroupLeaderUpload {
    period_id: number;
    period_name: string;
    profile_id: number;
    profile_name: string;
    project_id: number;
    project_name: string;
    uploaded_days: number;
    Type_P_G: string;
    head: string;
    transaction_date: Date | null;
    remarks: string;
}
 
export interface HaziriWorkerUpload {
    period_id: number;
    period_name: string;
    profile_id: number;
    profile_code: string;
    group_id: number;
    group_name: string;
    profile_name: string;
    project_id: number;
    project_name: string;
    uploaded_days: number;
    Type_P_G: string;
}