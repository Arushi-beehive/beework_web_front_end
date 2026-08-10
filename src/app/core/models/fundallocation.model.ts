export interface FundAllocationUpload {
    requisition_id: number;
    approved_amount: number;
}

export interface SubmitAttendance {
    attendanceDate: AvailablePermission[];
    createdBy: number;
    groupLeaderId: number;
    workerId: number;
}

export interface AvailablePermission {
    id: number;
}
export interface PaymentGroupLeaderUpload {
    period_id: number;
    period_name: string;
    profile_id: number;
    profile_name: string;
    project_id: number;
    project_name: string;
    uploaded_amount: number;
    Type_P_G: string;
}

export interface PaymentWorkerUpload {
    period_id: number;
    period_name: string;
    profile_id: number;
    profile_code: string;
    group_id: number;
    group_name: string;
    profile_name: string;
    project_id: number;
    project_name: string;
    uploaded_amount: number;
    Type_P_G: string;
}