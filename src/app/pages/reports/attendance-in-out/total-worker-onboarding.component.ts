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
import { DashboardsService } from '@/core/services/dashboardCard.service';

@Component({
    selector: 'app-total-worker-onboarding',
    imports: [CommonModule, ReactiveFormsModule, TableModule, InputTextModule, FormsModule, FileUploadModule, ButtonModule, DropdownModule, ToggleSwitchModule],
    templateUrl: './total-worker-onboarding.component.html',
    styleUrl: './total-worker-onboarding.component.scss',
    providers: [MessageService]
})
export class TotalWorkerOnboardingComponent {
    reportForm!: FormGroup;
    today: Date = new Date();
    columns: any[] = [];
    recordReport: any[] = [];
    originalReport: any[] = [];
    companyId = '';
    periodOptions: { label: string; value: string }[] = [
    { label: 'Jan-26', value: 'JAN-26' },
    { label: 'Feb-26', value: 'FEB-26' },
    { label: 'Mar-26', value: 'MAR-26' },
    { label: 'Apr-26', value: 'APR-26' },
    { label: 'May-26', value: 'MAY-26' },
    { label: 'Jun-26', value: 'JUN-26' },
    { label: 'Jul-26', value: 'JUL-26' },
    { label: 'Aug-26', value: 'AUG-26' },
    { label: 'Sep-26', value: 'SEP-26' },
    { label: 'Oct-26', value: 'OCT-26' },
    { label: 'Nov-26', value: 'NOV-26' },
    { label: 'Dec-26', value: 'DEC-26' },
];
workerOptions: any[] = [];

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private messageService: MessageService,
        private setupService: SetupMaintainceService,
        private reportService: DashboardsService
    ) {}

    ngOnInit(): void {
        this.reportForm = this.fb.group({
          period:      ['', Validators.required],
            worker:      ['', Validators.required]
        });
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.loadDropdown('ALLWORKER','workerOptions');
    }

    loadDropdown(type: string, key: 'workerOptions') {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: '',
            username: '',
           option1: this.companyId, 
            option2:''
        };
        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res) => {
                this[key] = res.data;
            }
        });
    }

  display(): void {
    const { period, worker } = this.reportForm.value;

    const payload: DropdownParamter = {
        returnType:  'INOUTREPORT',
        returnValue: period,
        username:  worker,
       option1: this.companyId, 
        option2:''
    };

    this.reportService.onGetReportDetails(payload).subscribe({
        next: (res) => {
            this.columns       = res.data.columns;
            this.originalReport = res.data.data;
            this.recordReport = [...this.originalReport];

            if (this.recordReport.length === 0) {
                this.showSuccess('No data available for the selected filters.');
            }
            console.log(this.recordReport)
        }
    });
}
    onReportChange(event: any) {
        const projectName = event.value;
        if (!projectName) {
            return;
        }
    }

    reset() {
        this.reportForm.reset({
        period:      '',
        worker:      ''
    });
    this.recordReport  = [];
    this.columns       = [];
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
