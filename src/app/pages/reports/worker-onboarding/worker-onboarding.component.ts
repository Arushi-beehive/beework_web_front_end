import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { AuthService } from '@/core/services/auth.service';
import { DropdownParamter } from '@/core/models/setup.model';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { MobileOption } from '@/core/models/project.model';
import * as XLSX from 'xlsx';
import { CheckboxModule } from 'primeng/checkbox';
import { DashboardsService } from '@/core/services/dashboardCard.service';

@Component({
    selector: 'app-worker-onboarding',
    imports: [CommonModule, ReactiveFormsModule, TableModule, InputTextModule, FormsModule, FileUploadModule, ButtonModule, DropdownModule, ToggleSwitchModule, CheckboxModule],
    templateUrl: './worker-onboarding.component.html',
    styleUrl: './worker-onboarding.component.scss',
    providers: [MessageService]
})
export class WorkerOnboardingComponent {
    reportForm!: FormGroup;
    today: Date = new Date();
    columns: any[] = [];
    projectNameOptions: any[] = [];
    groupLeaderOptions: MobileOption[] = [];
    supervisiorOptions: any[] = [];
    recordReport: any[] = [];
    originalReport: any[] = [];
    companyId = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private messageService: MessageService,
        private setupService: SetupMaintainceService,
        private reportService: DashboardsService
    ) {}

    ngOnInit(): void {
        this.reportForm = this.fb.group({
            projectName: ['', [Validators.required]],
            groupleader: [''],
            supervisior: [''],
            filterPhoto: [false],
            filterAadhar: [false],
            filterBank: [false]
        });
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.loadDropdown('ACTIVEPROJECT', 'projectNameOptions', '');
        this.loadDropdownMaster();
        this.reportForm.get('projectName')?.valueChanges.subscribe((selected) => {
            this.reportForm.patchValue({ groupleader: null });
        });
    }

    loadDropdown(type: string, key: 'projectNameOptions' | 'groupLeaderOptions', value: string) {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: '',
            option1: this.companyId,
            option2: ''
        };
        const $api = type==='ACTIVEPROJECT'? this.setupService.onDropdownDetailsPublic(payload) : this.setupService.onDropdownDetails(payload);
        $api.subscribe({
            next: (res) => {
                this[key] = res.data;
            }
        });
    }

    loadDropdownMaster() {
        const payload: any = {};
        const ddType = 'GROUP LEADER';
        const ddValue = null;
        const companyId = this.companyId;
        this.setupService.onGetDropdownMaster(payload, ddType, ddValue, companyId).subscribe({
            next: (res: any) => {
                this.groupLeaderOptions = res.data.data;
            }
        });
    }

    display() {
        const projectName = this.reportForm.controls['projectName'].value;
        const groupLeader = this.reportForm.controls['groupleader'].value;
        const supervisior = this.reportForm.controls['supervisior'].value;
        const filterPhoto = this.reportForm.controls['filterPhoto'].value;
        const filterAadhar = this.reportForm.controls['filterAadhar'].value;
        const filterBank = this.reportForm.controls['filterBank'].value;
        const loginid = this.authService.isLogIntType().userid;
        const payload: DropdownParamter = {
            returnType: 'REPORTDATAINCOMPLETE',
            returnValue: projectName,
            username: loginid,
            option1: this.companyId,
            option2: ''
        };
        this.reportService.onGetReportDetails(payload).subscribe({
            next: (res) => {
                this.columns = res.data.columns;
                this.originalReport = res.data.data;
                this.recordReport = [...this.originalReport];
                let filtered = [...this.originalReport];
                if (projectName) {
                    filtered = filtered.filter((r) => r.project_id === projectName);
                }

                if (groupLeader) {
                    filtered = filtered.filter((r) => r.group_leader_id === groupLeader);
                }

                if (supervisior) {
                    filtered = filtered.filter((r) => r.supervisior_id !== supervisior);
                }

                if (filterPhoto) {
                    filtered = filtered.filter((r) => r.photo !== 'Yes');
                }

                if (filterAadhar) {
                    filtered = filtered.filter((r) => r.aadhaarno === '');
                }

                if (filterBank) {
                    filtered = filtered.filter((r) => r.accountno === null);
                }

                this.recordReport = [...filtered];

                if (filtered.length === 0) {
                    this.showSuccess('No Data Available for the selected filters.');
                }
            }
        });
    }

    onReportChange(event: any) {
        const projectName = event.value;
        if (!projectName) {
            return;
        }
    }

    projectChange(data: any) {
        if (data.value) {
            this.loadDropdown('ACTIVEGROUPLEADER', 'groupLeaderOptions', data.value);
        } else {
            this.loadDropdownMaster();
        }
    }

    reset() {
        this.reportForm.reset({
            filterPhoto: false,
            filterAadhar: false,
            filterBank: false
        });
        this.recordReport = [];
        this.columns = [];
    }

    downloadExcel() {
        const exportData = this.recordReport.map((row) => {
            const obj: any = {};
            this.columns.forEach((col) => {
                obj[col.header] = row[col.field];
            });
            return obj;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'Worker_Onboarding_Report.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
