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
import { saveAs } from 'file-saver';
import { DashboardsService } from '@/core/services/dashboardCard.service';

@Component({
    selector: 'app-daily-labour',
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
    templateUrl: './daily-labour.component.html',
    styleUrl: './daily-labour.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class DailyLabourComponent {
    reportForm!: FormGroup;
    today: Date = new Date();
    columns: any[] = [];
    projectNameOptions: any[] = [];
    groupLeaderOptions: any[] = [];
    recordReport: any[] = [];
    originalReport: any[] = [];
    columnLeftOffsets: number[] = [];
    companyId = '';
    periodOptions: any[] = [];

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private messageService: MessageService,
        private setupService: SetupMaintainceService,
        private reportService: DashboardsService
    ) {}

    ngOnInit(): void {
        this.reportForm = this.fb.group({
            period: ['', [Validators.required]],
            projectName: ['', [Validators.required]],
            groupleader: [''],
            reportType: ['groupLeader']
        });
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.loadDropdown('ACTIVEPROJECT', 'projectNameOptions', '');
        this.loadDropdown('PERIOD','periodOptions','')
        this.loadDropdownMaster();
        this.reportForm.get('projectName')?.valueChanges.subscribe((selected) => {
            this.reportForm.patchValue({ groupleader: null });
        });
        this.reportForm.get('reportType')?.valueChanges.subscribe(() => {
            this.computeStickyOffsets();
        });
    }

    loadDropdown(type: string, key: 'projectNameOptions' | 'groupLeaderOptions'| 'periodOptions', value: string) {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: '',
            option1: this.companyId,
            option2: ''
        };
        const $api = (type==='ACTIVEPROJECT' || type==='PERIOD')? this.setupService.onDropdownDetailsPublic(payload) : this.setupService.onDropdownDetails(payload);
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

    onProjectChange(data: any) {
        console.log(data);
        if (data.value) {
            this.loadDropdown('ACTIVEGROUPLEADER', 'groupLeaderOptions', data.value);
        } else {
            this.loadDropdownMaster();
        }
    }

    display() {
        const projectName = this.reportForm.controls['projectName'].value;
        const period = this.reportForm.controls['period'].value;
        const groupLeader = this.reportForm.controls['groupleader'].value;
        const reportType = this.reportForm.controls['reportType'].value;
        let payload: DropdownParamter;
        if (reportType === 'groupLeader') {
            payload = {
                returnType: 'REPORTDLR',
                returnValue: period,
                username: projectName.toString(),
                option1: this.companyId,
                option2: ''
            };
        } else {
            payload = {
                returnType: 'REPORTDLRWORKER',
                returnValue: period,
                username: projectName.toString(),
                option1: this.companyId,
                option2: ''
            };
        }

        this.reportService.onGetReportDetails(payload).subscribe({
            next: (res) => {
                this.columns = res?.data?.columns ?? [];
                this.computeStickyOffsets();
                this.originalReport = Array.isArray(res?.dat?.data) ? res.data.data : [];

                let filtered = [...this.originalReport];

                if (groupLeader) {
                    const selectedOption = this.groupLeaderOptions.find((g) => g.id === groupLeader);
                    if (selectedOption) {
                        filtered = filtered.filter((r) => r.group_leader === selectedOption.dd_value);
                    }
                }

                this.recordReport = [...filtered];

                if (filtered.length === 0) {
                    this.showSuccess('No Data Available for the selected filters.');
                }
            },
            error: () => {
                this.originalReport = [];
                this.recordReport = [];
            }
        });
    }

    computeStickyOffsets(): void {
        const reporttype = this.reportForm.controls['reportType'].value;
        const n = reporttype === 'groupLeader' ? 5 : 6;
        let left = 0;
        this.columnLeftOffsets = this.columns.map((col, i) => {
            const offset = i < n ? left : 0;
            if (i < n) {
                left += Number(col.width) || 100;
            }
            return offset;
        });
    }

    get stickyCount(): number {
        return this.reportForm.get('reportType')?.value === 'groupLeader' ? 5 : 6;
    }

    onReportChange(event: any) {
        const projectName = event.value;
        if (!projectName) {
            return;
        }
    }

    reset() {
        this.reportForm.reset({
            period: '',
            projectName: '',
            groupleader: ''
        });
        this.columns = [];
        this.originalReport = [];
        this.recordReport = [];
    }

    downloadExcel() {
        const exportData = this.recordReport.map((row) => {
            const obj: any = {};
            this.columns.forEach((col) => {
                const value = row[col.field] ?? '';
                const trimmed = value.toString().trim();
                const num = parseFloat(trimmed);
                obj[col.header] = !isNaN(num) && trimmed !== '' ? num : trimmed;
            });
            return obj;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);

        // Force numeric cells
        const range = XLSX.utils.decode_range(ws['!ref']!);
        for (let R = range.s.r + 1; R <= range.e.r; R++) {
            for (let C = range.s.c; C <= range.e.c; C++) {
                const addr = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = ws[addr];
                if (!cell) continue;
                const raw = (cell.v ?? '').toString().trim();
                const num = parseFloat(raw);
                if (raw !== '' && !isNaN(num)) {
                    ws[addr] = { t: 'n', v: num }; // ✅ force number
                }
            }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // ✅ Write to buffer and use FileSaver instead of XLSX.writeFile
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, 'Daily_Labour_Report.xlsx'); // ✅ FileSaver handles HTTP too
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
