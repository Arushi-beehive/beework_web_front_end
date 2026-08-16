import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { Tag } from 'primeng/tag';
import { DropdownParamter } from '@/core/models/setup.model';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { MyApprovalService } from '@/core/services/my-aprroval.service';
import { AuthService } from '@/core/services/auth.service';
import * as XLSX from 'xlsx';
import { RequestApprovalModel } from '@/core/models/approval.model';

@Component({
    selector: 'app-my-approval',
    imports: [CommonModule, ReactiveFormsModule, TextareaModule, TableModule, InputTextModule, FormsModule, ButtonModule, DropdownModule, RippleModule, MessageModule, DialogModule, ConfirmDialogModule, CheckboxModule, Card, Divider, Tag],
    templateUrl: './my-approval.component.html',
    styleUrl: './my-approval.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class MyApprovalComponent implements OnInit {
    approvalForm!: FormGroup;
    selectedRow: any = null;
    first: number = 0;
    rowsPerPage: number = 5;
    viewdetails: boolean = false;
    rejectiondetails: boolean = false;
    approvalDetails: boolean = false;
    showData: boolean = false;
    rejectComment: string = '';
    submitted: boolean = false;
    newRate: number | null = null;
    newRateUnit: string = '';
    selectedRejectRow: any = null;
    selectedApproveRow: any = null;
    companyId = '';
    typeOptions: any[] = [];
    requestOptions: any[] = [
        { label: 'APPROVED', value: 'APPROVED' },
        { label: 'REJECTED', value: 'REJECTED' },
        { label: 'PENDING', value: 'PENDING' }
    ];
    projectNameOptions: any[] = [];
    groupLeaderOptions: any[] = [];
    workerOptions: any[] = [];
    periodOptions: any[] = [];
    products: any[] = [];
    filteredProducts: any[] = [];

    approvalHistory = [
        { level: 'L1', approver: 'Manager', status: 'Approved', date: '19-Mar-2026', comment: 'Looks good.' },
        { level: 'L2', approver: 'Finance', status: 'Rejected', date: '20-Mar-2026', comment: 'Pricing is too low.' }
    ];

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private datePipe: DatePipe,
        private authService: AuthService,
        private confirmationService: ConfirmationService,
        private setupService: SetupMaintainceService,
        private myapprovalService: MyApprovalService
    ) {}

    ngOnInit(): void {
        this.approvalForm = this.fb.group({
            p_type: [null, [Validators.required]],
            p_request: ['PENDING'],
            projectName: ['', [Validators.required]],
            groupleader: [''],
            period: ['']
        });
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.loadDropdown('RULENAME', 'typeOptions');
        this.loadDropdown('ACTIVEPROJECT', 'projectNameOptions');
        this.loadDropdown('PERIOD', 'periodOptions')
    
        this.approvalForm.get('p_type')?.valueChanges.subscribe((selectedRuleId) => {
            this.updatePeriodValidator(selectedRuleId);
        });

        this.approvalForm.get('groupleader')?.valueChanges.subscribe(()=>{
            if(this.products.length>0){
                this.display();
            }
        });

        this.approvalForm.get('period')?.valueChanges.subscribe((()=>{
            if(this.products.length>0){
             this.display();
            }
        }));

         this.approvalForm.get('p_request')?.valueChanges.subscribe((()=>{
            if(this.products.length>0){
             this.display();
            }
        }));
    }

    updatePeriodValidator(selectedRuleId: any) {
        const periodControl = this.approvalForm.get('period');
        const selectedRule = this.typeOptions.find((r) => r.rule_id === selectedRuleId);

        const isWorkerWage = selectedRule?.rule_name?.toLowerCase().includes('haziri card');

        if (isWorkerWage) {
            periodControl?.setValidators([Validators.required]);
        } else {
            periodControl?.clearValidators();
            periodControl?.setValue(null);
        }
        periodControl?.updateValueAndValidity();
    }

    isPeriodRequired(): boolean {
        return this.approvalForm.get('period')?.hasValidator(Validators.required) ?? false;
    }

    loadDropdown(type: string, key: 'typeOptions' | 'projectNameOptions' | 'workerOptions' | 'periodOptions') {
        let value = '';
        let loginid = 0;

        if (type === 'GETWAGEAPPROVAL') {
            value = this.authService.isLogIntType().usertypeid;
            loginid = this.approvalForm.controls['projectName'].value;
        } else {
            loginid = this.authService.isLogIntType().userid;
        }
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value.toString(),
            username: loginid.toString(),
           option1: this.companyId,
            option2:''
        };

        const $api = (type==='ACTIVEPROJECT' || type==='PERIOD') ? this.setupService.onDropdownDetailsPublic(payload) : this.setupService.onDropdownDetails(payload);

        $api.subscribe({
            next: (res) => {
                this[key] = res.data;

                if (type === 'RULENAME' && key === 'typeOptions') {
                    const defaultOption = res.data.find((item: any) => item.rule_name === 'Worker Wage');
                    if (defaultOption) {
                        this.approvalForm.controls['p_type'].setValue(defaultOption.rule_id);
                    }
                }
            }
        });
    }

    onProjectNameChange(event: any) {
          const payload: DropdownParamter = {
              returnType: 'ACTIVEGROUPLEADER',
              returnValue: event.value.toString(),
              username:'',
              option1: this.companyId,
              option2: ''
          };
          this.setupService.onDropdownDetails(payload).subscribe({
            next:(res)=> this.groupLeaderOptions = res.data
          })
    }

    display() {
        const type = this.approvalForm.controls['p_type'].value;
        const projectName = this.approvalForm.controls['projectName'].value;
        const groupLeader = this.approvalForm.controls['groupleader'].value;
        const period = this.approvalForm.controls['period'].value;
        const request = this.approvalForm.controls['p_request'].value;
        const value = this.authService.isLogIntType().usertypeid;
        const loginid = this.approvalForm.controls['projectName'].value;

        const payload: DropdownParamter = {
            returnType: 'GETWAGEAPPROVAL', 
            returnValue: value.toString(),
            username: loginid.toString(),
           option1: this.companyId,
            option2:''
        };

        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res) => {
                let filtered = [...res.data];

                if(!projectName){
                    this.products=[];
                    return;
                }

                if (projectName) {
                    filtered = filtered.filter((r) => r.project_id === projectName);
                }

                if (groupLeader) {
                    filtered = filtered.filter((r) => r.group_leader_id === groupLeader);
                }

                if (type) {
                    const selectedRule = this.typeOptions.find((t: any) => t.rule_id === type);
                    if (selectedRule) {
                        filtered = filtered.filter((r) => r.request_type.toLowerCase() === selectedRule.rule_name.toLowerCase());
                    }
                }

                if (period) {
                    filtered = filtered.filter((r) => {
                        const date = new Date(r.request_date);
                        const month = date.toLocaleString('en-US' , {month:'short'}).toUpperCase();
                        const year = date.getFullYear().toString().slice(-2);
                        const datePeriod = `${month}-${year}`;
                        console.log(period, datePeriod)
                        return datePeriod === period;
                    });
                }

                if (request) {
                    filtered = filtered.filter((r) => r.status === request);
                }

                this.products = [...filtered];

                if (filtered.length === 0) {
                    this.showSuccess('No Data Available for the selected filters.');
                }
            }
        });
    }

    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
    }

    reset() {
         this.products = [];
        this.showData = false;
        const defaultType = this.typeOptions.find((item:any)=> item.rule_name === 'Worker Wage');
        this.approvalForm.reset({
            p_type: defaultType?.rule_id ?? null,
            p_request: 'PENDING',
            projectName: '',
            groupleader: '',
            period: null
        });
       this.groupLeaderOptions=[];
        this.approvalForm.get('period')?.clearValidators();
        this.approvalForm.get('period')?.updateValueAndValidity();
    }

    // ✅ Download as XLSX
    downloadExcel() {
        if (!this.products || this.products.length === 0) {
            this.errorSuccess('No data available to download.');
            return;
        }

        const exportData = this.products.map((item) => ({
            Id: item.id,
            Type: item.type,
            Project: item.project,
            'Group Leader': item.groupleader,
            Requester: item.requester,
            Mobile: item.mobile,
            Date: item.date,
            Amount: item.amount,
            Status: item.status
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Approvals');

        const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd_HH-mm');
        XLSX.writeFile(workbook, `Approval_Report_${currentDate}.xlsx`);

        this.showSuccess('Excel file downloaded successfully!');
    }

    onDownloadClick() {
        if (this.approvalForm.invalid) {
            this.errorSuccess('Please fill all required fields before downloading.');
            return;
        }
        if (!this.products || this.products.length === 0) {
            if (!this.showData) {
                this.errorSuccess('Please click "Display" first to load data before downloading.');
                return;
            } else {
                this.errorSuccess('No data available to download.');
                return;
            }
        }
        this.downloadExcel();
    }

    view(id: number) {
        this.viewdetails = true;
    }

    approved(row: any) {
        this.newRate = null;
        this.newRateUnit = '';
        this.selectedApproveRow = row;
        this.approvalDetails = true;
        this.rejectiondetails = false;
    }

    getSeverity(status: string) {
        switch (status) {
            case 'Approved':
                return 'success';
            case 'Rejected':
                return 'danger';
            case 'Pending':
                return 'warning';
            default:
                return 'info';
        }
    }

    reject(event: any) {
        this.rejectComment = '';
        this.submitted = false;
        this.selectedRejectRow = event;
        this.rejectiondetails = true;
        this.approvalDetails = false;
    }

    submitApproval(data?: any) {
        console.log('shdj',data)
        const rowData = data || this.selectedApproveRow;
        const userid = this.authService.isLogIntType().userid;
        const usertypeid = this.authService.isLogIntType().usertypeid;
        const payload: any = {
            requestId: rowData.request_id,
            userId: userid,
            userTypeId: usertypeid,
            action: 'APPROVE',
            remark: 'APPROVED'
        };
        // const payload : RequestApprovalModel = {
        //     ruleId :
        //     requesterId:rowData.request_id,
        //     requestType:rowData.re
        //     period:
        //     userId: userid
        // }
        this.myapprovalService.onGetApprovalSubmit(payload).subscribe({
            next: (res) => {
                const index = this.products.findIndex((p) => p.request_id === rowData.request_id);
                if (index !== -1) {
                    if (this.newRate !== null && this.newRate !== undefined) {
                        this.products[index].new_rate = this.newRate;
                        this.products[index].new_rateunit = this.newRateUnit || this.products[index].new_rateunit;
                    }
                    this.products[index].status = 'APPROVED';
                    this.products = [...this.products];
                }
                this.approvalDetails = false;
                this.showSuccess('Request Approved successfully!');
            },
            error: () => {
                this.errorSuccess('Failed to approve request.');
            }
        });
    }

    submitReject() {
        this.submitted = true;
        if (!this.rejectComment || this.rejectComment.trim().length === 0) return;
        const userid = this.authService.isLogIntType().userid;
        const usertypeid = this.authService.isLogIntType().usertypeid;
        this.rejectiondetails = false;
        this.approvalDetails = false;
        const payload: any = {
            requestId: this.selectedRejectRow?.request_id,
            userId: userid,
            userTypeId: usertypeid,
            action: 'REJECT',
            remark: this.rejectComment
        };
        this.myapprovalService.onGetApprovalSubmit(payload).subscribe({
            next: (res) => console.log(res)
        });
        this.showSuccess('Request Rejected!!');
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
