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
    selector: 'app-worker-payment',
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
    templateUrl: './worker-payment.component.html',
    styleUrl: './worker-payment.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class WorkerPaymentComponent {
    reportForm!: FormGroup;
    today: Date = new Date();
    columns: any[] = [];
    projectNameOptions: any[] = [];
    groupLeaderOptions: any[] = [];
    recordReport: any[] = [];
    originalReport: any[] = [];
    columnLeftOffsets: number[] = [];
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
            groupleader: ['']
        });
        this.loadDropdown('ACTIVEPROJECT', 'projectNameOptions', '');
        this.loadDropdown('PERIOD','periodOptions','');
        this.loadDropdownMaster();
        this.reportForm.get('projectName')?.valueChanges.subscribe((selected) => {
            this.reportForm.patchValue({ groupleader: null });
        });
    }

    loadDropdown(type: string, key: 'projectNameOptions' | 'groupLeaderOptions' | 'periodOptions', value: string) {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: ''
        };
        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res) => {
                this[key] = res.data;
            }
        });
    }

    loadDropdownMaster() {
        const payload: any = {};
        const ddType = 'GROUP LEADER';
        const ddValue = null;
        this.setupService.onGetDropdownMaster(payload, ddType, ddValue).subscribe({
            next: (res: any) => {
                this.groupLeaderOptions = res.data.data;
            }
        });
    }

    onProjectChange(data: any) {
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
        let payload: DropdownParamter;
            payload = {
                returnType: 'PAYMENTREPORT',
                returnValue: period,
                username: projectName.toString()
            };

        this.reportService.onGetReportDetails(payload).subscribe({
            next: (res) => {
                this.columns = res?.data?.columns ?? [];
                this.originalReport = Array.isArray(res?.data?.data) ? res.data.data : [];

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
          a.download = 'Worker_Payment_Report.xlsx';
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