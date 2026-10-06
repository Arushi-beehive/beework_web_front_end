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

export interface StageGroupLeaderPayment{
    p_company_id: number;
    p_operation: 'VALIDATE' | 'PROCESS' | string;  
    p_uploaded_file_name: string;
    p_uploaded_by: number;
    p_data?: GroupLeaderPaymentRow[] | null;
}

export interface GroupLeaderPaymentRow {
    period_id: number;
    project_id: number;
    group_leader_id: number;
    period_name: string;
    site_name: string;
    group_leader_name: string;
    head: string;
    transaction_date: string;      // 'dd/MM/yyyy', e.g. '03/04/2026'
    transaction_type: string;      // 'P' in your sample
    active: 'Y' | 'N';
    amount: number;
    remark: string;                // '' when empty
}

export interface StageWorkerPayment{
    p_company_id: number;
    p_operation: 'VALIDATE' | 'PROCESS' | string;  
    p_uploaded_file_name: string;
    p_uploaded_by: number;
    p_data?: WorkerPaymentRow[] | null;
}

export interface WorkerPaymentRow {
            period_id: string;
            profile_id: string;
            project_id: string;
            group_id: string;
            group_leader_name: string;
            site_name: string;
            period_name: string;
            worker_code: string;
            worker_mobile: string;
            worker_aadhaar: string;
            worker_name: string;
            head: string;
            transaction_type: string;
            active: string;
            amount: string;
            remark: string;
            transaction_date: string;
        }

        export interface BulkUpdateWorkerProfileRate {
            p_company_id: number;
    p_operation: 'VALIDATE' | 'PROCESS' | string;  
    p_uploaded_file_name: string;
    p_uploaded_by: number;
    p_data?: WorkerRateRow[] | null; 
        }

        export interface WorkerRateRow {
            profileid: string;
            rate: string;
        }
