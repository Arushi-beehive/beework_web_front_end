export interface ApprovalModel {
    requestId: number;
    userId: number;
    userTypeId: number;
    action: string;
    remark: string;
}

export interface RequestApprovalModel {
    ruleId: number;
    userId: number;
    requesterId: number;
    requestType: string;
    period:string;
}
