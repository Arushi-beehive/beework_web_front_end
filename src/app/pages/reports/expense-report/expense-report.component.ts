import { DropdownParamter } from '@/core/models/setup.model';
import { AuthService } from '@/core/services/auth.service';
import { DashboardsService } from '@/core/services/dashboardCard.service';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-expense-report',
  imports: [CommonModule, ReactiveFormsModule, DropdownModule, MultiSelectModule, ButtonModule, TableModule],
  templateUrl: './expense-report.component.html',
  styleUrl: './expense-report.component.scss'
})
export class ExpenseReportComponent {
  expenseReportForm!: FormGroup;

  periodOptions:any[] = [];
  projectOptions:any[] = [];
  groupLeaderOptions:any[] = [];
  workerOptions:any[] = [];
  recordReport: any[] = [];
  originalReport: any[] = [];
  columns: any[] = [];
  reportTypeOptions = [
    { label: 'Group Leader', value: 'GROUP_LEADER' },
    { label: 'Worker', value: 'WORKER' }
  ];

  constructor(
    private fb: FormBuilder,
    private setupService: SetupMaintainceService,
    private authService: AuthService,
    private messageService: MessageService,
    private dashboardService: DashboardsService
  ) {}

ngOnInit() {
    this.expenseReportForm = this.fb.group({
      site: ['', Validators.required],
      period: ['', Validators.required],
      reportType: ['', Validators.required],
      groupLeaderName: [[]],
      workerName: [[]]
    });
    this.loadDropdown('PERIOD', 'periodOptions', '');
    this.loadDropdown('ACTIVEPROJECT', 'projectOptions', '');
    this.loadDropdown('GROUP LEADER', 'groupLeaderOptions', '');
    this.loadDropdown('WORKER', 'workerOptions', '');
  }

  get isGroupLeaderSelected(): boolean {
    return this.expenseReportForm.get('reportType')?.value === 'GROUP_LEADER';
  }

  get isWorkerSelected(): boolean {
    return this.expenseReportForm.get('reportType')?.value === 'WORKER';
  }

  private getWorkerProfileId(row: any): number {
    const rawId = row?.profileid ?? row?.profile_id ?? row?.worker_profile_id ?? row?.workerid ?? row?.userid;
    const numericId = Number(rawId);
    return Number.isFinite(numericId) ? numericId : 0;
  }

    loadDropdown(type: string, key: 'groupLeaderOptions' | 'periodOptions' | 'workerOptions' | 'projectOptions', value: string) {
          const payload: DropdownParamter = {
              returnType: type,
              returnValue: value,
              username: '',
              option1: this.authService.isLogIntType()?.companyid.toString(),
              option2: ''
          };
    const $api = (type === 'PERIOD' || type === 'ACTIVEPROJECT') ? this.setupService.onDropdownDetailsPublic(payload) : this.setupService.onDropdownDetails(payload);
          $api.subscribe({
              next: (res) => {
            this[key] = Array.isArray(res?.data) ? res.data : [];
              }
          });
      }

onProjectChange(data: any) {
   if (data.value) {
    if(this.isGroupLeaderSelected) {
        this.loadDropdown('ACTIVEGROUPLEADER', 'groupLeaderOptions', data.value);
    }else if(this.isWorkerSelected) {
            this.loadDropdown('PROJECTBASEDWORKER', 'workerOptions', data.value);
    }
    else{
      return;
    }
        }
}

  onReportTypeChange() {
    const projectValue = this.expenseReportForm.get('site')?.value;
    this.recordReport = [];
    this.originalReport = [];
    this.columns = [];

    if (this.isGroupLeaderSelected) {
      this.expenseReportForm.get('workerName')?.reset([]);
      if (projectValue) {
        this.loadDropdown('ACTIVEGROUPLEADER', 'groupLeaderOptions', projectValue);
      }
    }

    if (this.isWorkerSelected) {
      this.expenseReportForm.get('groupLeaderName')?.reset([]);
      if (projectValue) {
        this.loadDropdown('PROJECTBASEDWORKER', 'workerOptions', projectValue);
      }
    }
  }

  display(){
    const periodValue  = this.periodOptions.find((period: any) => period.period_id === this.expenseReportForm.get('period')?.value)?.period_name;
    const selectedGroupLeaders: string[] = this.expenseReportForm.get('groupLeaderName')?.value ?? [];
    const selectedWorkers: any[] = this.expenseReportForm.get('workerName')?.value ?? [];

    const payload: DropdownParamter = {
      returnType: 'EXPENSEREPORT',
      returnValue: periodValue || '',
      username: this.expenseReportForm.get('site')?.value,
      option1: this.authService.isLogIntType()?.companyid.toString(),
      option2: ''
    };

    this.dashboardService.onGetReportDetails(payload).subscribe({
      next: (res) => {
        this.columns = Array.isArray(res?.data?.columns) ? res.data.columns : [];
        this.originalReport = Array.isArray(res?.data?.data) ? res.data.data : [];

        let filtered = [...this.originalReport];

        if (this.isGroupLeaderSelected && selectedGroupLeaders.length > 0) {
          const selectedLeaderSet = new Set(selectedGroupLeaders.map((v) => v?.toString().toLowerCase().trim()));
          filtered = filtered.filter((row) => {
            const leaderName = (row?.group_leader_name ?? row?.group_leader ?? row?.groupleader_name)?.toString().toLowerCase().trim();
            return selectedLeaderSet.has(leaderName);
          });
        }

        if (this.isWorkerSelected && selectedWorkers.length > 0) {
          const selectedWorkerIdSet = new Set(selectedWorkers.map((v) => v?.toString()));
          const selectedWorkerNameSet = new Set(
            this.workerOptions
              .filter((w) => selectedWorkerIdSet.has((w?.profileid ?? w?.profile_id)?.toString()))
              .map((w) => (w?.worker_name ?? w?.profile_name)?.toString().toLowerCase().trim())
          );

          filtered = filtered.filter((row) => {
            const rowWorkerId = this.getWorkerProfileId(row)?.toString();
            const rowWorkerName = (row?.worker_name ?? row?.profile_name)?.toString().toLowerCase().trim();
            return selectedWorkerIdSet.has(rowWorkerId) || selectedWorkerNameSet.has(rowWorkerName);
          });
        }

        this.recordReport = [...filtered];

        if (this.recordReport.length === 0) {
          this.showSuccess('No data available for the selected filters.');
        }
      },
      error: (err) => {
        console.error(err);
        this.columns = [];
        this.originalReport = [];
        this.recordReport = [];
        this.errorSuccess('Failed to load expense report data.');
      }
    });
  }

  onSubmit() {
    this.expenseReportForm.markAllAsTouched();
    if (this.expenseReportForm.invalid) {
      return;
    }

    // Integrate API/report generation here when backend contract is ready.
    console.log('Expense report filters:', this.expenseReportForm.value);
  }

   downloadExcel() {
        if (!this.columns.length || !this.recordReport.length) {
          this.errorSuccess('No data available to download.');
          return;
        }

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
            a.download = 'Expense_Report.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }

         reset() {
        this.expenseReportForm.reset({
          site: '',
            period: '',
            reportType: '',
          groupLeaderName: [],
          workerName: []
        });
        this.columns = [];
        this.originalReport = [];
        this.recordReport = [];
    }

  showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }

}
