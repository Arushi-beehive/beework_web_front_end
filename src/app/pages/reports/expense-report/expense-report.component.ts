import { DropdownParamter } from '@/core/models/setup.model';
import { AuthService } from '@/core/services/auth.service';
import { DashboardsService } from '@/core/services/dashboardCard.service';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import * as XLSX from 'xlsx';

// Cross-field validator: at least one of "site" or "groupLeaderName" must be set.
function siteOrGroupLeaderValidator(group: AbstractControl): { [key: string]: boolean } | null {
  const site = group.get('site')?.value;
  const groupLeaderName = group.get('groupLeaderName')?.value;
  const hasSite = !!site;
  const hasGroupLeader = !!groupLeaderName;
  return hasSite || hasGroupLeader ? null : { siteOrGroupLeaderRequired: true };
}

@Component({
  selector: 'app-expense-report',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    MultiSelectModule,
    ButtonModule,
    TableModule,
    CheckboxModule,
    CalendarModule,
    InputTextModule
  ],
  templateUrl: './expense-report.component.html',
  styleUrl: './expense-report.component.scss'
})
export class ExpenseReportComponent {
  expenseReportForm!: FormGroup;

  periodOptions:any[] = [];
  projectOptions:any[] = [];
  groupLeaderOptions:any[] = [];
  workerOptions:any[] = [];
  // Raw cross-joined project/group-leader rows (project_id, project_name, id, dd_value, mobile_no) fetched once.
  private groupLeaderProjectMaster: any[] = [];
  recordReport: any[] = [];
  originalReport: any[] = [];
  columns: any[] = [];
  reportTypeOptions = [
    { label: 'Group Leader', value: 'GROUP_LEADER' },
    // { label: 'Worker', value: 'WORKER' }
  ];

  constructor(
    private fb: FormBuilder,
    private setupService: SetupMaintainceService,
    private authService: AuthService,
    private messageService: MessageService,
    private dashboardService: DashboardsService
  ) {}

ngOnInit() {
    this.expenseReportForm = this.fb.group(
      {
        site: [''],
        period: [''],
        reportType: ['GROUP_LEADER', Validators.required],
        groupLeaderName: [null],
        workerName: [[]],
        onlyDue: [false],
        statement: [false],
        startMonth: [null],
        endMonth: [null]
      },
      { validators: siteOrGroupLeaderValidator }
    );

    // When "Statement" is checked, Start Month / End Month become mandatory;
    // when unchecked, clear their validators and values.
    this.expenseReportForm.get('statement')?.valueChanges.subscribe((checked: boolean) => {
      const startMonthControl = this.expenseReportForm.get('startMonth');
      const endMonthControl = this.expenseReportForm.get('endMonth');

      if (checked) {
        startMonthControl?.setValidators([Validators.required]);
        endMonthControl?.setValidators([Validators.required]);
      } else {
        startMonthControl?.clearValidators();
        endMonthControl?.clearValidators();
        startMonthControl?.reset(null);
        endMonthControl?.reset(null);
      }

      startMonthControl?.updateValueAndValidity();
      endMonthControl?.updateValueAndValidity();
    });

    this.loadDropdown('PERIOD', 'periodOptions', '');
    this.loadDropdown('PROJECTLIST', 'projectOptions', this.authService.isLogIntType()?.userid.toString(), this.authService.isLogIntType()?.userid.toString() );
    this.loadDropdown('WORKER', 'workerOptions', '');
    this.loadGroupLeaderProjectMaster();
  }

  // Fetch the full project/group-leader cross-join once; all cascading filtering is then done client-side.
  private loadGroupLeaderProjectMaster() {
    const payload: DropdownParamter = {
      returnType: 'PROJECTGROUPLEADERLIST',
      returnValue: '',
      username: this.authService.isLogIntType()?.userid.toString() ?? '',
      option1: this.authService.isLogIntType()?.companyid.toString(),
      option2: ''
    };

    this.setupService.onDropdownDetails(payload).subscribe({
      next: (res) => {
        this.groupLeaderProjectMaster = Array.isArray(res?.data) ? res.data : [];
        this.applyGroupLeaderProjectFilters();
      }
    });
  }

  private getDistinctProjects(data: any[]): any[] {
    const seen = new Map<string, any>();
    data.forEach((item) => {
      const key = item?.project_id?.toString();
      if (key && !seen.has(key)) {
        seen.set(key, { project_id: item.project_id, project_name: item.project_name });
      }
    });
    return Array.from(seen.values());
  }

  private getDistinctGroupLeaders(data: any[]): any[] {
    const seen = new Map<string, any>();
    data.forEach((item) => {
      const key = item?.id?.toString();
      if (key && !seen.has(key)) {
        seen.set(key, { id: item.id, dd_value: item.dd_value, mobile_no: item.mobile_no });
      }
    });
    return Array.from(seen.values());
  }

  // Cascades Site <-> Group Leader options from the master list: each dropdown's options are
  // narrowed by the other's current selection (their intersection when both are selected).
  private applyGroupLeaderProjectFilters() {
    const siteValue = this.expenseReportForm.get('site')?.value;
    const groupLeaderValue = this.expenseReportForm.get('groupLeaderName')?.value;
    const master = this.groupLeaderProjectMaster;

    const rowsForProjectOptions = groupLeaderValue
      ? master.filter((row) => row?.id?.toString() === groupLeaderValue.toString())
      : master;
    const rowsForGroupLeaderOptions = siteValue
      ? master.filter((row) => row?.project_id?.toString() === siteValue.toString())
      : master;

    this.projectOptions = this.getDistinctProjects(rowsForProjectOptions);
    this.groupLeaderOptions = this.getDistinctGroupLeaders(rowsForGroupLeaderOptions);
  }

  get isGroupLeaderSelected(): boolean {
    return this.expenseReportForm.get('reportType')?.value === 'GROUP_LEADER';
  }

  get isWorkerSelected(): boolean {
    return this.expenseReportForm.get('reportType')?.value === 'WORKER';
  }

  get isStatementChecked(): boolean {
    return !!this.expenseReportForm.get('statement')?.value;
  }

  get isDisplayDisabled(): boolean {
    const siteValue = this.expenseReportForm.get('site')?.value;
    const groupLeaderValue = this.expenseReportForm.get('groupLeaderName')?.value;
    return this.isStatementChecked || (!siteValue && !groupLeaderValue);
  }

  // Table width should grow to fit the actual columns returned by the API instead of a fixed guess.
  get tableMinWidth(): string {
    const total = this.columns.reduce((sum, col) => sum + (Number(col?.width) || 150), 0);
    return `${Math.max(total, 800)}px`;
  }

  private getWorkerProfileId(row: any): number {
    const rawId = row?.profileid ?? row?.profile_id ?? row?.worker_profile_id ?? row?.workerid ?? row?.userid;
    const numericId = Number(rawId);
    return Number.isFinite(numericId) ? numericId : 0;
  }

  // NOTE: adjust these field names to match whatever your backend actually
  // returns for a group leader's id / name on a report row.
  private getGroupLeaderId(row: any): string {
    const rawId = row?.group_leader_id ?? row?.groupleaderid ?? row?.group_leaderid ?? row?.id;
    return rawId !== undefined && rawId !== null ? rawId.toString() : '';
  }

  // Site and Group Leader are no longer hard-disabled on the Display/Download
  // buttons; instead we validate on click and surface an error toast.
  private validateSiteOrGroupLeader(): boolean {
    const siteValue = this.expenseReportForm.get('site')?.value;
    const groupLeaderValue = this.expenseReportForm.get('groupLeaderName')?.value;

    if (!siteValue && !groupLeaderValue) {
      this.expenseReportForm.get('site')?.markAsTouched();
      this.expenseReportForm.get('groupLeaderName')?.markAsTouched();
      this.errorSuccess('Please select Group Leader.');
      return false;
    }

    return true;
  }

    loadDropdown(type: string, key: 'groupLeaderOptions' | 'periodOptions' | 'workerOptions' | 'projectOptions', value: string, p_username?: string) {
          const payload: DropdownParamter = {
              returnType: type,
              returnValue: value,
              username: p_username ?? '', 
              option1: this.authService.isLogIntType()?.companyid.toString(),
              option2: ''
          };
    const $api = (type === 'PERIOD' || type === 'PROJECTLIST') ? this.setupService.onDropdownDetailsPublic(payload) : this.setupService.onDropdownDetails(payload);
          $api.subscribe({
              next: (res) => {
            this[key] = Array.isArray(res?.data) ? res.data : [];
              }
          });
      }

onProjectChange(data: any) {
   const projectValue = data?.value ?? null;

   if (this.isGroupLeaderSelected) {
        // Re-derive Group Leader (and Site) options client-side from the cached master list.
        this.applyGroupLeaderProjectFilters();
   } else if(this.isWorkerSelected) {
        if (projectValue) {
            this.loadDropdown('PROJECTBASEDWORKER', 'workerOptions', projectValue);
        }
   }
}

onGroupLeaderChange(data: any) {
    // Re-derive Site (and Group Leader) options client-side from the cached master list.
    this.applyGroupLeaderProjectFilters();
}

  onReportTypeChange() {
    const projectValue = this.expenseReportForm.get('site')?.value;
    this.recordReport = [];
    this.originalReport = [];
    this.columns = [];

    if (this.isGroupLeaderSelected) {
      this.expenseReportForm.get('workerName')?.reset([]);
      this.applyGroupLeaderProjectFilters();
    }

    if (this.isWorkerSelected) {
      this.expenseReportForm.get('groupLeaderName')?.reset(null);
      if (projectValue) {
        this.loadDropdown('PROJECTBASEDWORKER', 'workerOptions', projectValue);
      }
    }
  }

  display(){
    if (!this.validateSiteOrGroupLeader()) {
      return;
    }

    // const periodValue  = this.periodOptions.find((period: any) => period.period_id === this.expenseReportForm.get('period')?.value)?.period_name;
    const selectedGroupLeader: any = this.expenseReportForm.get('groupLeaderName')?.value ?? null;
    const selectedWorkers: any[] = this.expenseReportForm.get('workerName')?.value ?? [];
    const onlyDueValue = this.expenseReportForm.get('onlyDue')?.value ? 'D' : 'A';

    const payload: DropdownParamter = {
      returnType: 'EXPENSEREPORT',
      returnValue: this.expenseReportForm.get('site')?.value?.toString() || null,
      username: selectedGroupLeader ? selectedGroupLeader.toString() : null,
      option1: this.authService.isLogIntType()?.companyid.toString(),
      option2: onlyDueValue
    };

    this.dashboardService.onGetReportDetails(payload).subscribe({
      next: (res) => {
        this.columns = Array.isArray(res?.data?.columns) ? res.data.columns : [];
        this.originalReport = Array.isArray(res?.data?.data) ? res.data.data : [];

        let filtered = [...this.originalReport];

        if (this.isGroupLeaderSelected && selectedGroupLeader) {
          const selectedLeaderId = selectedGroupLeader.toString();
          const selectedLeaderName = this.groupLeaderOptions
            .find((gl) => (gl?.id)?.toString() === selectedLeaderId)
            ?.dd_value?.toString().toLowerCase().trim();

          filtered = filtered.filter((row) => {
            const rowLeaderId = this.getGroupLeaderId(row);
            const rowLeaderName = (row?.group_leader_name ?? row?.group_leader ?? row?.groupleader_name)?.toString().toLowerCase().trim();
            return rowLeaderId === selectedLeaderId || (!!selectedLeaderName && rowLeaderName === selectedLeaderName);
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

  get totalDueColumnField(): string | null {
  if (!this.columns?.length) return null;
  const dueCol = this.columns.find((c: any) => /due/i.test(c?.header || '') || /due/i.test(c?.field || ''));
  if (dueCol) return dueCol.field;
  const amountCol = this.columns.find((c: any) => /amount/i.test(c?.header || '') || /amount/i.test(c?.field || ''));
  return amountCol ? amountCol.field : null;
}

get totalDueColumnHeader(): string {
  const field = this.totalDueColumnField;
  const col = this.columns.find((c: any) => c.field === field);
  return col?.header || 'Due Amount';
}

get totalDueAmount(): number {
  const field = this.totalDueColumnField;
  if (!field) return 0;
  return this.recordReport.reduce((sum, row) => {
    const val = parseFloat(row?.[field]);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);
}

  onSubmit() {
    this.expenseReportForm.markAllAsTouched();
    if (this.expenseReportForm.invalid) {
      return;
    }

    // Integrate API/report generation here when backend contract is ready.
    console.log('Expense report filters:', this.expenseReportForm.value);
  }

  private exportToExcel(columns: any[], data: any[], filename: string) {
    const exportData = data.map((row) => {
      const obj: any = {};
      columns.forEach((col) => {
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
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  downloadExcel() {
    if (this.isStatementChecked) {
      this.downloadStatementExcel();
      return;
    }

    if (!this.columns.length || !this.recordReport.length) {
      this.errorSuccess('No data available to download.');
      return;
    }

    this.exportToExcel(this.columns, this.recordReport, 'Expense_Report.xlsx');
  }

  // Statement API is only called when the "Statement" checkbox is checked.
  private downloadStatementExcel() {
    if (!this.validateSiteOrGroupLeader()) {
      return;
    }

    const startMonthControl = this.expenseReportForm.get('startMonth');
    const endMonthControl = this.expenseReportForm.get('endMonth');
    startMonthControl?.markAsTouched();
    endMonthControl?.markAsTouched();

    if (startMonthControl?.invalid || endMonthControl?.invalid) {
      this.errorSuccess('Start Month and End Month are required for Statement.');
      return;
    }

    const selectedGroupLeader: any = this.expenseReportForm.get('groupLeaderName')?.value ?? null;
    const onlyDueValue = this.expenseReportForm.get('onlyDue')?.value ? 'D' : 'A';

    const payload: DropdownParamter = {
      returnType: 'EXPENSEREPORTSTATEMENT',
      returnValue: selectedGroupLeader ? selectedGroupLeader.toString() : null,
      username: this.expenseReportForm.get('startMonth')?.value,
      option1: this.authService.isLogIntType()?.companyid.toString(),
      option2: this.expenseReportForm.get('endMonth')?.value,
    };

    this.dashboardService.onGetReportDetails(payload).subscribe({
      next: (res) => {
        const columns = Array.isArray(res?.data?.columns) ? res.data.columns : [];
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];

        if (!columns.length || !data.length) {
          this.errorSuccess('No data available for the selected statement filters.');
          return;
        }

        this.exportToExcel(columns, data, 'Statement_Report.xlsx');
      },
      error: (err) => {
        console.error(err);
        this.errorSuccess('Failed to load statement report data.');
      }
    });
  }

  // ---- Reset ----

  reset() {
        this.expenseReportForm.reset({
          site: '',
            period: '',
            reportType: 'GROUP_LEADER',
          groupLeaderName: null,
          workerName: [],
          onlyDue: false,
          statement: false,
          startMonth: null,
          endMonth: null
        });
        this.columns = [];
        this.originalReport = [];
        this.recordReport = [];
        this.loadDropdown('PROJECTLIST', 'projectOptions', this.authService.isLogIntType()?.userid.toString(), this.authService.isLogIntType()?.userid.toString());
        this.applyGroupLeaderProjectFilters();
    }

  showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }

}