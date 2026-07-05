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
    periodOptions: any[] = [];
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
        this.loadDropdown('ALLWORKER','workerOptions');
        this.loadDropdown('PERIOD','periodOptions');
    }

    loadDropdown(type: string, key: 'workerOptions'|'periodOptions') {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: '',
            username: ''
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
        username:  worker
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
