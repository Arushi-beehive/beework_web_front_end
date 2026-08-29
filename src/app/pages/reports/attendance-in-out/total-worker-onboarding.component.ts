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
    projectNameOptions: any[] = [];
    groupLeaderOptions: any[] = [];
    private groupLeaderProjectMaster: any[] = [];

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
            period: ['', Validators.required],
            projectName: [''],
            groupleader: ['']
        });
        this.companyId = this.authService.isLogIntType().companyid.toString();
        this.loadDropdown('PROJECTLIST', 'projectNameOptions', this.authService.isLogIntType().userid.toString(), this.authService.isLogIntType().userid.toString());
        this.loadDropdown('PERIOD', 'periodOptions', '');
        this.loadGroupLeaderProjectMaster();
    }

    loadDropdown(type: string, key: 'projectNameOptions' | 'groupLeaderOptions' | 'periodOptions', value: string, p_username?: string) {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: p_username ?? '',
            option1: this.companyId,
            option2: null
        };
        const $api = (type==='PROJECTLIST' || type==='PERIOD')? this.setupService.onDropdownDetailsPublic(payload) : this.setupService.onDropdownDetails(payload);
        $api.subscribe({
            next: (res) => {
                this[key] = res.data;
            }
        });
    }

   onProjectChange(data: any): void {
    const projectValue = data?.value ?? null;

    this.applyGroupLeaderProjectFilters();

    // If project is cleared, restore all group leaders
    if (!projectValue) {
        this.reportForm.get('groupleader')?.reset('');
        this.applyGroupLeaderProjectFilters();
    }
}

    private loadGroupLeaderProjectMaster(): void {
    const payload: DropdownParamter = {
        returnType: 'PROJECTGROUPLEADERLIST',
        returnValue: '',
        username: this.authService.isLogIntType()?.userid?.toString() ?? '',
        option1: this.companyId,
        option2: ''
    };

    this.setupService.onDropdownDetails(payload).subscribe({
        next: (res) => {
            this.groupLeaderProjectMaster = Array.isArray(res?.data)
                ? res.data
                : [];

            // Initially show all available group leaders
            this.applyGroupLeaderProjectFilters();
        },
        error: (err) => {
            console.error('Failed to load project/group leader mapping:', err);
            this.groupLeaderProjectMaster = [];
            this.groupLeaderOptions = [];
        }
    });
}

private getDistinctProjects(data: any[]): any[] {
    const seen = new Map<string, any>();

    data.forEach((item) => {
        const key = item?.project_id?.toString();

        if (key && !seen.has(key)) {
            seen.set(key, {
                project_id: item.project_id,
                project_name: item.project_name
            });
        }
    });

    return Array.from(seen.values());
}

private getDistinctGroupLeaders(data: any[]): any[] {
    const seen = new Map<string, any>();

    data.forEach((item) => {
        const key = item?.id?.toString();

        if (key && !seen.has(key)) {
            seen.set(key, {
                id: item.id,
                dd_value: item.dd_value,
                mobile_no: item.mobile_no
            });
        }
    });

    return Array.from(seen.values());
}

private applyGroupLeaderProjectFilters(): void {
    const projectValue = this.reportForm.get('projectName')?.value;
    const groupLeaderValue = this.reportForm.get('groupleader')?.value;

    const master = this.groupLeaderProjectMaster;

    // Group Leader dropdown should be filtered based on selected Project
    const rowsForGroupLeaderOptions = projectValue
        ? master.filter(
              (row) =>
                  row?.project_id?.toString() ===
                  projectValue.toString()
          )
        : master;

    // Project dropdown should be filtered based on selected Group Leader
    const rowsForProjectOptions = groupLeaderValue
        ? master.filter(
              (row) =>
                  row?.id?.toString() ===
                  groupLeaderValue.toString()
          )
        : master;

    this.groupLeaderOptions =
        this.getDistinctGroupLeaders(rowsForGroupLeaderOptions);

    this.projectNameOptions =
        this.getDistinctProjects(rowsForProjectOptions);
}

    display(): void {
        const projectName = this.reportForm.controls['projectName'].value;
        const period = this.reportForm.controls['period'].value;
        const groupLeader = this.reportForm.controls['groupleader'].value;

        const payload: DropdownParamter = {
            returnType: 'INOUTREPORT',
            returnValue: period,
            username: projectName.toString() || null,
            option1: this.companyId,
            option2: groupLeader ? groupLeader.toString() : null
        };

        this.reportService.onGetReportDetails(payload).subscribe({
            next: (res) => {
                this.columns = res.data.columns;
                this.originalReport = res.data.data;
                this.recordReport = [...this.originalReport];
                let filtered = [...this.originalReport];

                if (groupLeader) {
                    const selectedOption = this.groupLeaderOptions.find((g) => g.id === groupLeader);
                    if (selectedOption) {
                        filtered = filtered.filter((r) => r.group_leader === selectedOption.dd_value);
                    }
                }

                this.recordReport = [...filtered];
                if (this.recordReport.length === 0) {
                    this.showSuccess('No data available for the selected filters.');
                }
                console.log(this.recordReport);
            }
        });
    }

onGroupLeaderChange(data: any): void {
    this.applyGroupLeaderProjectFilters();

    const groupLeaderValue = data?.value ?? null;

    // If group leader is cleared, restore all projects
    if (!groupLeaderValue) {
        this.reportForm.get('projectName')?.reset('');
        this.applyGroupLeaderProjectFilters();
    }
}

    onReportChange(event: any) {
        const projectName = event.value;
        if (!projectName) {
            return;
        }
    }

    // Table width should grow to fit the actual columns returned by the API instead of a fixed guess.
    get tableMinWidth(): string {
        const total = this.columns.reduce((sum, col) => sum + (Number(col?.width) || 150), 0);
        return `${Math.max(total, 800)}px`;
    }

    // Cumulative left offset (px) for the first 4 frozen columns, based on preceding columns' widths.
    getFrozenLeft(index: number): string {
        let left = 0;
        for (let i = 0; i < index; i++) {
            left += Number(this.columns[i]?.width) || 150;
        }
        return `${left}px`;
    }

    reset() {
        this.reportForm.reset({
          period: '',
        projectName: '',
        groupleader: ''
        });
        this.groupLeaderOptions = [];
        this.recordReport = [];
        this.columns = [];
    this.projectNameOptions = this.getDistinctProjects( this.groupLeaderProjectMaster );
    this.groupLeaderOptions = this.getDistinctGroupLeaders( this.groupLeaderProjectMaster );
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
