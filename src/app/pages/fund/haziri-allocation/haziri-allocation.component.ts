import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { AuthService } from '@/core/services/auth.service';
import { DropdownParamter } from '@/core/models/setup.model';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { MobileOption } from '@/core/models/project.model';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
    selector: 'app-haziri-allocation',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        DropdownModule,
        DialogModule
    ],
    templateUrl: './haziri-allocation.component.html',
    styleUrl: './haziri-allocation.component.scss',
    providers: [DatePipe]
})
export class HaziriAllocationComponent {
    @Input() pageTitle = 'Haziri Allocation';

    haziriForm!: FormGroup;
    companyId = '';

    projectNameOptions: any[] = [];
    groupLeaderOptions: MobileOption[] = [];
    workerOptions: Array<{ profileid: number; worker_name: string }> = [];
    periodOptions: any[] = [];

    excelColumns: string[] = [];
    isExcelUploaded: boolean = false;
    showUploadPreviewDialog: boolean = false;
    recordReport: any[] = [];
    uploadFileName = '';
    uploadTemplateHref = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private messageService: MessageService,
        private datePipe: DatePipe,
        private setupService: SetupMaintainceService
    ) {}

    ngOnInit(): void {
        this.haziriForm = this.fb.group({
            projectName: [''],
            groupleader: [''],
            period: ['', Validators.required]
        });
        this.haziriForm.get('projectName')?.setValidators([Validators.required]);
        this.haziriForm.get('projectName')?.updateValueAndValidity();

        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.refreshUploadTemplateHref();
        this.loadDropdown('ACTIVEPROJECT', '', '', 'projectNameOptions');
        this.loadDropdown('PERIOD', '', '', 'periodOptions');
    }

    get downloadValidationMessage(): string {
        if (!this.haziriForm.get('period')?.value) return 'Select a period before downloading the Worker Haziri file.';
        if (!this.haziriForm.get('projectName')?.value) return 'Select a site before downloading the Worker Haziri file.';
        return '';
    }

    private getWorkerProfileId(row: any): number {
        const rawId = row?.profileid ?? row?.profile_id ?? row?.worker_profile_id ?? row?.workerprofileid ?? row?.userid;
        const numericId = Number(rawId);
        return Number.isFinite(numericId) ? numericId : 0;
    }

    private normalizeWorkerOptions(data: any[]): Array<{ profileid: number; worker_name: string }> {
        const unique = new Map<number, { profileid: number; worker_name: string }>();

        for (const row of data) {
            const profileId = this.getWorkerProfileId(row);
            const workerName = (row?.worker_name ?? row?.profile_name ?? row?.workername)?.toString().trim();

            if (profileId && workerName && !unique.has(profileId)) {
                unique.set(profileId, { profileid: profileId, worker_name: workerName });
            }
        }

        return Array.from(unique.values()).sort((a, b) => a.worker_name.localeCompare(b.worker_name));
    }

    loadDropdown(type: string, value: string | null, userid: string | null, key: 'projectNameOptions' | 'periodOptions' | 'workerOptions', options2?: string | null) {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: userid || '',
            option1: this.companyId,
            option2: options2 || ''
        };
        const $api = type === 'ACTIVEPROJECT' || type === 'PERIOD' ? this.setupService.onDropdownDetailsPublic(payload) : this.setupService.onDropdownDetails(payload);
        $api.subscribe({
            next: (res) => {
                const data = Array.isArray(res?.data) ? res.data : [];
                if (key === 'workerOptions') {
                    this.workerOptions = this.normalizeWorkerOptions(data);
                } else {
                    this[key] = data;
                }
                if (type === 'PROJECTBASEDWORKER') {
                    this.workerOptions = this.normalizeWorkerOptions(data);
                }
            },
            error: (err) => console.error(err)
        });
    }

    private getReportRequestParams(): { returnType: string; returnValue: string; username: string; option2: string } | null {
        const projectId = this.haziriForm.get('projectName')?.value?.toString();
        const periodId = this.haziriForm.get('period')?.value?.toString();

        if (!periodId || !projectId) {
            return null;
        }

        const periodValue = this.periodOptions.find((p) => p.period_id?.toString() === periodId);
        const periodName = periodValue?.period_name?.toString();
        return {
            returnType: 'WORKERBULKHAZIRI',
            returnValue: projectId,
            username: periodId,
            option2: periodName ?? ''
        };
    }

    onProjectChange(data: any): void {
        this.haziriForm.get('groupleader')?.reset('');
        this.clearUpload();

        if (!data?.value) {
            this.groupLeaderOptions = [];
            this.workerOptions = [];
            return;
        }

        this.loadDropdown('PROJECTBASEDWORKER', data.value, '', 'workerOptions');

        const payload: DropdownParamter = {
            returnType: 'ACTIVEGROUPLEADER',
            returnValue: data.value.toString(),
            username: '',
            option1: this.companyId,
            option2: ''
        };
        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res) => (this.groupLeaderOptions = res.data)
        });
    }

    onFileUpload(event: any) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        if (!/\.xlsx?$/i.test(file.name)) {
            this.errorSuccess('Please upload an Excel file (.xlsx or .xls).');
            input.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            this.errorSuccess('The file exceeds the 10 MB upload limit.');
            input.value = '';
            return;
        }

        this.clearUpload();
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                const workbook = XLSX.read(e.target?.result, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' }) as any[][];
                const headers = (sheetRows[0] ?? []).map((column) => column?.toString().replace(/^\uFEFF/, '').trim() ?? '');
                const rows = sheetRows.slice(1);
                const requiredColumns = ['Period Id', 'Profile Id', 'Project Id', 'Group Id', 'Group Leader Name', 'Site Name', 'Period Name', 'Worker Code', 'Worker Name', 'Type(P/G)', 'Active', 'Days Present'];
                const missingColumns = requiredColumns.filter((column) => !headers.includes(column));

                if (missingColumns.length) {
                    this.errorSuccess(`Required column(s) missing: ${missingColumns.join(', ')}.`);
                    return;
                }
                const dataRows = rows.filter((row) => row.some((value) => value?.toString().trim()));
                if (!dataRows.length) {
                    this.errorSuccess('The uploaded file has no data. Please check the file and try again.');
                    return;
                }

                this.excelColumns = headers;
                this.recordReport = dataRows.map((row) => Object.fromEntries(headers.map((column, index) => [column, row[index] ?? ''])));
                this.uploadFileName = file.name;
                this.isExcelUploaded = true;
            } catch {
                this.errorSuccess('Failed to read the file. Please upload a valid Excel file (.xlsx / .xls).');
            } finally {
                input.value = '';
            }
        };
        reader.onerror = () => {
            this.errorSuccess('File could not be read. Please try again.');
            input.value = '';
        };
        reader.readAsArrayBuffer(file);
    }

    showHaziriUploadPreview(): void {
        if (!this.isExcelUploaded || this.recordReport.length === 0) {
            this.errorSuccess('Upload a Haziri Excel file before proceeding.');
            return;
        }
        this.showUploadPreviewDialog = true;
    }

    clearUpload(): void {
        this.isExcelUploaded = false;
        this.showUploadPreviewDialog = false;
        this.recordReport = [];
        this.excelColumns = [];
        this.uploadFileName = '';
    }

    get uploadTemplateName(): string {
        return 'WORKER_HAZIRI_UPLOAD_TEMPLATE.xlsx';
    }

    private refreshUploadTemplateHref(): void {
        const headers = ['Period Id', 'Profile Id', 'Project Id', 'Group Id', 'Group Leader Name', 'Site Name', 'Period Name', 'Worker Code', 'Worker Name', 'Type(P/G)', 'Active', 'Days Present'];
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Worker Haziri');
        const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        this.uploadTemplateHref = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    }

    private applyClientFilters(data: any[]): any[] {
        let filtered = [...data];

        const selectedProjectId = this.haziriForm.get('projectName')?.value?.toString();
        const selectedProjectOption = this.projectNameOptions.find((p: any) => p?.project_id?.toString() === selectedProjectId);
        const selectedProjectName = selectedProjectOption?.project_name?.toString().toLowerCase().trim();

        if (selectedProjectId || selectedProjectName) {
            filtered = filtered.filter((row) => {
                const rowProjectId = row['project_id']?.toString();
                const rowProjectName = row['project_name']?.toString().toLowerCase().trim();
                return rowProjectId === selectedProjectId || (selectedProjectName ? rowProjectName === selectedProjectName : false);
            });
        }

        const selectedPeriodId = this.haziriForm.get('period')?.value?.toString();
        const selectedPeriodOption = this.periodOptions.find((p: any) => p?.period_id?.toString() === selectedPeriodId);
        const selectedPeriodName = selectedPeriodOption?.period_name?.toString().toLowerCase().trim();

        if (selectedPeriodId || selectedPeriodName) {
            filtered = filtered.filter((row) => {
                const rowPeriodId = row['period_id']?.toString();
                const rowPeriodName = (row['periodname'] ?? row['period_name'])?.toString().toLowerCase().trim();
                return rowPeriodId === selectedPeriodId || (selectedPeriodName ? rowPeriodName === selectedPeriodName : false);
            });
        }

        const groupleader = this.haziriForm.get('groupleader')?.value;
        if (groupleader) {
            const target = groupleader.toString().toLowerCase().trim();
            filtered = filtered.filter((row) => row['group_leader_name']?.toString().toLowerCase().trim().includes(target));
        }

        return filtered;
    }

    private buildWorksheetData(data: any[]): any[] {
        return data.map((row: any) => ({
            'Period Id': row.period_id ?? '',
            'Profile Id': row.profileid ?? '',
            'Project Id': row.project_id ?? '',
            'Group Id': row.group_leader_id ?? '',
            'Group Leader Name': row.group_leader_name ?? '',
            'Site Name': row.project_name ?? '',
            'Period Name': row.period_name ?? '',
            'Worker Code': row.worker_code ?? '',
            'Worker Name': row.worker_name ?? '',
            'Type(P/G)': row.type_p_g ?? '',
            Active: row.isactive ?? '',
            'Days Present': row.amount ?? ''
        }));
    }

    downloadExcel() {
        const params = this.getReportRequestParams();
        if (!params) {
            this.haziriForm.get('period')?.markAsTouched();
            this.haziriForm.get('projectName')?.markAsTouched();
            return;
        }
        const payload: DropdownParamter = {
            returnType: params.returnType,
            returnValue: params.returnValue,
            username: params.username || '',
            option1: this.companyId,
            option2: params.option2
        };

        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res: any) => {
                const data = res?.data || [];
                if (!data || data.length === 0) {
                    this.errorSuccess('No data available to download.');
                    return;
                }

                const worksheetData = this.buildWorksheetData(this.applyClientFilters(data));
                if (!worksheetData.length) {
                    this.errorSuccess('No data available for the selected filters.');
                    return;
                }
                const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Haziri Allocation');

                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
                const fileName = this.generateFileName();
                saveAs(blob, `${fileName}.xlsx`);

                this.showSuccess('Excel file downloaded successfully!');
            },
            error: (err) => {
                console.error(err);
                this.errorSuccess('Error downloading data. Please try again.');
            }
        });
    }

    private generateFileName(): string {
        const projectName = this.haziriForm.get('projectName')?.value || 'Project';
        const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd_HH-mm');
        return `${projectName}_Haziri_Report_${currentDate}`;
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}