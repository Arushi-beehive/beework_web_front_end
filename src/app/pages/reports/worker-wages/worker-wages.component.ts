import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '@/core/services/auth.service';
import { DropdownParamter } from '@/core/models/setup.model';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { MobileOption } from '@/core/models/project.model';
import * as XLSX from 'xlsx';
import { DashboardsService } from '@/core/services/dashboardCard.service';

@Component({
    selector: 'app-worker-wages',
    imports: [
        CommonModule,
        EditorModule,
        ReactiveFormsModule,
        TextareaModule,
        TableModule,
        InputTextModule,
        FormsModule,
        FileUploadModule,
        ButtonModule,
        SelectModule,
        DropdownModule,
        ToggleSwitchModule,
        RippleModule,
        ChipModule,
        FluidModule,
        MessageModule,
        DatePickerModule,
        DialogModule,
        AutoCompleteModule,
        ConfirmDialogModule,
        CheckboxModule
    ],
    templateUrl: './worker-wages.component.html',
    styleUrl: './worker-wages.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class WorkerWagesComponent {
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
            startDate: [this.today],
            endDate: [this.today],
            projectName: [''],
            groupleader: [''],
            supervisior: [''],
            fund: []
        });
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.loadDropdown('ACTIVEPROJECT', 'projectNameOptions');
        this.loadDropdownMaster();
        this.reportForm.get('projectName')?.valueChanges.subscribe((selected) => {
            this.reportForm.patchValue({ groupleader: null });
        });
        this.loadTableData();
    }

    loadDropdown(type: string, key: 'projectNameOptions') {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: '',
            username: '',
            option1: this.companyId,
            option2: ''
        };
        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res) => {
                this[key] = res.data;
            }
        });
    }

    loadDropdownMaster() {
        console.log;
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

    loadTableData() {
        const loginid = this.authService.isLogIntType().userid;
        const payload: DropdownParamter = {
            returnType: 'REPORTDATAINCOMPLETE',
            returnValue: '',
            username: loginid,
            option1: this.companyId,
            option2: ''
        };
        this.reportService.onGetReportDetails(payload).subscribe({
            next: (res) => {
                this.columns = res.data.columns;
                this.originalReport = res.data.data;
                this.recordReport = [...this.originalReport];
            }
        });
    }

    display() {
        const startDate = this.reportForm.controls['startDate'].value;
        const endDate = this.reportForm.controls['endDate'].value;
        const projectName = this.reportForm.controls['projectName'].value;
        const groupLeader = this.reportForm.controls['groupleader'].value;
        const supervisior = this.reportForm.controls['supervisior'].value;

        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            this.errorSuccess('To Date must be greater than or equal to From Date.');
            return;
        }

        let filtered = [...this.originalReport];
        if (startDate) {
            const from = new Date(startDate);
            from.setHours(0, 0, 0, 0);
            filtered = filtered.filter((r) => new Date(r.date) >= from);
        }

        if (endDate) {
            const to = new Date(endDate);
            to.setHours(23, 59, 59, 999);
            filtered = filtered.filter((r) => new Date(r.date) <= to);
        }

        if (projectName) {
            filtered = filtered.filter((r) => r.project_id === projectName);
        }

        if (groupLeader) {
            filtered = filtered.filter((r) => r.group_leader_id === groupLeader);
            console.log('dfs', filtered);
        }

        if (supervisior) {
            filtered = filtered.filter((r) => r.supervisior_id === supervisior);
        }

        this.recordReport = filtered;
        console.log('ans', this.recordReport, filtered);
        this.recordReport = [...filtered];

        if (filtered.length === 0) {
            this.showSuccess('No Data Available for the selected filters.');
        }
    }

    onReportChange(event: any) {
        const projectName = event.value;
        if (!projectName) {
            return;
        }
    }

    reset() {
        this.reportForm.reset({
            startDate: this.today,
            endDate: this.today
        });
        this.recordReport = [...this.originalReport];
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
        XLSX.writeFile(wb, 'export.xlsx');
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
