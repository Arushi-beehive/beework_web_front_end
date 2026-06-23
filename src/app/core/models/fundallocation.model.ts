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
