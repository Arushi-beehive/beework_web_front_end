import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
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
import { FundService } from '@/core/services/fund.service';
import { BulkUpdateWorkerProfileRate, FundAllocationUpload, GroupLeaderPaymentRow, StageGroupLeaderPayment, StageWorkerPayment, WorkerPaymentRow, WorkerRateRow } from '@/core/models/fundallocation.model';
import { Observable } from 'rxjs';

interface UploadValidationIssue {
    rowNumber: number;
    column: string;
    value: string;
    issue: string;
    type: 'Error' | 'Warning';
}

@Component({
    selector: 'app-fund-allocation',
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
    templateUrl: './fund-allocation.component.html',
    styleUrl: './fund-allocation.component.scss',
    providers: [ConfirmationService, DatePipe]
})
export class FundAllocationComponent {
    @Input() initialReportType: 'demand' | 'payment' = 'payment';
    @Input() showReportTypeSwitch = false;
    @Input() pageTitle = 'Fund Allocation';
    fundForm!: FormGroup;
    visibleDialog = false;
    selectedRow: any = null;
    selection: boolean = true;
    first: number = 0;
    rowsPerPage: number = 5;
    globalFilter: string = '';
    companyId = '';
    today: Date = new Date();
    categoryOptions = [];
    itemOptions = [];
    filteredProducts: any[] = [];
    allRecord: any[] = [];
    columns: any[] = [];
    projectNameOptions: any[] = [];
    groupLeaderOptions: MobileOption[] = [];
    workerOptions: Array<{ profileid: number; worker_name: string }> = [];
    excelColumns: string[] = [];
    isExcelUploaded: boolean = false;
    recordReport: any[] = [];
    requestOptions: any[] = [
        { fieldid: 'APPROVED', fieldname: 'APPROVED' },
        { fieldid: 'PENDING', fieldname: 'PENDING' },
        { fieldid: 'REJECTED', fieldname: 'REJECTED' }
    ];
    paymentForOptions = [
        { label: 'Group Leader Payment', value: 'GROUP_LEADER' },
        { label: 'Worker Payment', value: 'WORKER' },
        { label: 'Worker Rate', value: 'WORKER_RATE' }
    ];

    selectedStatus: string | null = 'PENDING';
    periodOptions: any[] = [];
    protected hasDemandSearchExecuted: boolean = false;
    uploadFileName = '';
    uploadedPaymentRows: any[] = [];
    uploadPreviewColumns: string[] = [];
    uploadValidationIssues: UploadValidationIssue[] = [];
    isUploadValidated = false;
    isProcessingUpload = false;
    hasUploadProcessed = false;
    isUploadDragOver = false;
    showUploadPreviewDialog = false;
    uploadTemplateHref = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private messageService: MessageService,
        private datePipe: DatePipe,
        private setupService: SetupMaintainceService,
        private fundService: FundService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.fundForm = this.fb.group({
            startDate: [this.today],
            endDate: [this.today],
            projectName: [''],
            groupleader: [],
            workerProfile: [],
            fund: [],
            period: [''],
            paymentFor: [''],
            reportType: [this.initialReportType, Validators.required]
        });
        this.selectedStatus = this.initialReportType === 'payment' ? 'APPROVED' : 'PENDING';
        this.updatePeriodValidation();
        this.refreshUploadTemplateHref();
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.loadDropdown('ACTIVEPROJECT', '', '', 'projectNameOptions');
        this.loadDropdown('PERIOD', '', '', 'periodOptions');
    }

    private buildWorkerRateRows(data: any[]): WorkerRateRow[] {
        return data.map((row: any) => ({
            profileid: row['Worker Id']?.toString().trim() ?? '',
            rate: row['Rate']?.toString().trim() ?? ''
        }));
    }

    private bulkUpdateWorkerProfileRate(operation: BulkUpdateWorkerProfileRate['p_operation']) {
        return this.fundService.bulkUpdateWorkerProfileRate({
            p_company_id: this.uploadCompanyId,
            p_operation: operation,
            p_uploaded_file_name: this.uploadFileName,
            p_uploaded_by: this.uploadUserId,
            p_data: this.buildWorkerRateRows(this.uploadedPaymentRows)
        });
    }

    private processWorkerRateUpload(operation: BulkUpdateWorkerProfileRate['p_operation']): void {
        this.isProcessingUpload = true;
        if (operation === 'VALIDATE') this.isUploadValidated = false;
        this.bulkUpdateWorkerProfileRate(operation).subscribe({
            next: (response: any) => {
                this.isProcessingUpload = false;
                const issues = this.readStageValidationIssues(response);
                if (issues.length) {
                    this.uploadValidationIssues.push(...issues);
                    this.isUploadValidated = true;
                    this.showUploadPreviewDialog = false;
                    return;
                }

                if (operation === 'VALIDATE') {
                    this.isUploadValidated = true;
                    this.showUploadPreviewDialog = true;
                    this.showSuccess(`Validation complete. ${this.uploadedPaymentRows.length} row(s) are ready to process.`);
                    return;
                }

                this.hasUploadProcessed = true;
                this.showUploadPreviewDialog = false;
                this.showSuccess(response?.data?.message || `${this.uploadedPaymentRows.length} worker rate(s) updated successfully.`);
            },
            error: (error: any) => {
                this.isProcessingUpload = false;
                const issues = this.readStageValidationIssues(error);
                this.uploadValidationIssues.push(...(issues.length ? issues : [this.createStageRequestIssue(error)]));
                this.isUploadValidated = true;
                this.showUploadPreviewDialog = false;
            }
        });
    }

    onReportTypeChange(type: 'demand' | 'payment') {
        this.fundForm.get('reportType')?.setValue(type);
        this.fundForm.get('projectName')?.reset('');
        this.recordReport = [];
        this.filteredProducts = [];
        this.allRecord = [];

        if (type === 'demand') {
            this.selectedStatus = 'PENDING';
            this.hasDemandSearchExecuted = false;
            this.fundForm.get('period')?.reset('');
            this.fundForm.get('paymentFor')?.reset('');
            this.fundForm.get('groupleader')?.reset('');
            this.fundForm.get('startDate')?.setValue(this.today);
            this.fundForm.get('endDate')?.setValue(this.today);
            this.updatePeriodValidation();
        } else {
            this.selectedStatus = 'APPROVED';
            this.hasDemandSearchExecuted = false;
            if (!this.fundForm.get('paymentFor')?.value) {
                this.fundForm.get('paymentFor')?.setValue('GROUP_LEADER');
            }
            this.fundForm.get('groupleader')?.reset('');
            this.fundForm.get('workerProfile')?.reset('');
            this.workerOptions = [];
            this.updatePeriodValidation();
        }
        this.refreshUploadTemplateHref();
    }

    protected updatePeriodValidation() {
        const periodControl = this.fundForm.get('period');
        const paymentfor = this.fundForm.get('paymentFor');
        const project = this.fundForm.get('projectName');
        if (!periodControl) return;

        if (this.isPaymentReport) {
            if (this.selectedPaymentFor === 'WORKER_RATE') {
                periodControl.clearValidators();
            } else {
                periodControl.setValidators([Validators.required]);
            }
            paymentfor?.setValidators([Validators.required]);
            if (this.selectedPaymentFor === 'WORKER' || this.selectedPaymentFor === 'WORKER_RATE') {
                project?.setValidators([Validators.required]);
            } else {
                project?.clearValidators();
            }
        } else {
            periodControl.clearValidators();
            paymentfor?.clearValidators();
            project?.clearValidators();
        }

        periodControl.updateValueAndValidity();
        paymentfor?.updateValueAndValidity();
        project?.updateValueAndValidity();
    }

    get isPaymentReport(): boolean {
        return this.fundForm?.get('reportType')?.value === 'payment';
    }

    get selectedPaymentFor(): string {
        return this.fundForm.get('paymentFor')?.value;
    }

    get downloadValidationMessage(): string {
        if (!this.isPaymentReport) return '';

        const paymentFor = this.selectedPaymentFor;
        const hasSite = !!this.fundForm.get('projectName')?.value;
        const hasPeriod = !!this.fundForm.get('period')?.value;

        if (!paymentFor || (paymentFor !== 'WORKER_RATE' && !hasPeriod)) {
            return paymentFor === 'WORKER' ? 'Please select Period, Payment For, and Site before downloading Worker payments.' : 'Please select Period and Payment For before downloading.';
        }
        if ((paymentFor === 'WORKER' || paymentFor === 'WORKER_RATE') && !hasSite) {
            return paymentFor === 'WORKER' ? 'Please select Period, Payment For, and Site before downloading Worker payments.' : 'Please select Site before downloading Worker rates.';
        }
        return '';
    }

    get uploadTemplateName(): string {
        switch (this.selectedPaymentFor) {
            case 'GROUP_LEADER':
                return 'GROUP_LEADER_PAYMENT_UPLOAD_TEMPLATE.xlsx';
            case 'WORKER':
                return 'WORKER_PAYMENT_UPLOAD_TEMPLATE.xlsx';
            case 'WORKER_RATE':
                return 'WORKER_RATE_UPLOAD_TEMPLATE.xlsx';
            default:
                return 'PAYMENT_UPLOAD_TEMPLATE.xlsx';
        }
    }

    private refreshUploadTemplateHref(): void {
        if (!this.selectedPaymentFor) {
            this.uploadTemplateHref = '';
            return;
        }

        let headers: string[];
        switch (this.selectedPaymentFor) {
            case 'GROUP_LEADER':
                headers = ['Period Id', 'Period Name', 'Site Id', 'Site Name', 'Group Leader Id', 'Group Leader Name', 'Head', 'Transaction Date', 'Type(P/G)', 'Active', 'Amount', 'Remark'];
                break;
            case 'WORKER':
                headers = [
                    'Period Id',
                    'Period Name',
                    'Site Id',
                    'Site Name',
                    'Group Leader Id',
                    'Group Leader Name',
                    'Worker Id',
                    'Worker Code',
                    'Worker Name',
                    'Worker Mobile',
                    'Worker Aadhaar',
                    'Head',
                    'Transaction Date',
                    'Type(P/W)',
                    'Active',
                    'Amount',
                    'Remark'
                ];
                break;
            case 'WORKER_RATE':
                headers = ['Site Id', 'Site Name', 'Group Leader Id', 'Group Leader Name', 'Worker Id', 'Worker Code', 'Worker Name', 'Worker Mobile', 'Worker Aadhaar', 'Is Active', 'Trade', 'Rate'];
                break;
            default:
                headers = ['Select an upload type to download its template'];
        }
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Upload Template');
        const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        this.uploadTemplateHref = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    }

    private refreshWorkerOptions(records: any[] = []) {
        const unique = new Map<number, { profileid: number; worker_name: string }>();

        for (const row of records) {
            const profileId = this.getWorkerProfileId(row);
            const workerName = row?.worker_name?.toString().trim();

            if (profileId && workerName && !unique.has(profileId)) {
                unique.set(profileId, { profileid: profileId, worker_name: workerName });
            }
        }

        this.workerOptions = Array.from(unique.values()).sort((a, b) => a.worker_name.localeCompare(b.worker_name));
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

    loadDropdown(type: string, value: string | null, userid: string | null, key: 'projectNameOptions' | 'recordReport' | 'periodOptions' | 'workerOptions', options2?: string | null, showImmediately: boolean = true) {
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
                if (key === 'recordReport') {
                    this.allRecord = [...data];
                    this.filteredProducts = data;
                    if (showImmediately) {
                        this.applyStatusFilter();
                    }
                }
            },
            error: (err) => {
                console.error(err);
                if (key === 'recordReport') {
                    this.recordReport = [];
                    this.allRecord = [];
                    this.filteredProducts = [];
                }
            }
        });
    }

    private getReportRequestParams(mode: 'search' | 'download' = 'search'): { returnType: string; returnValue: string | null; username?: string | null; option2: string | null } | null {
        if (!this.isPaymentReport) {
            return { returnType: 'REQINPUT', returnValue: null, option2: '' };
        }

        const paymentFor = this.fundForm.get('paymentFor')?.value;
        const projectId = this.fundForm.get('projectName')?.value?.toString();
        const periodId = this.fundForm.get('period')?.value;

        const isWorkerRateDownload = mode === 'download' && paymentFor === 'WORKER_RATE';
        const requiresSite = paymentFor === 'WORKER' || paymentFor === 'WORKER_RATE';
        if (!paymentFor || (!isWorkerRateDownload && !periodId) || (requiresSite && !projectId)) {
            return null;
        }

        if (isWorkerRateDownload) {
            return {
                returnType: 'WORKERBULKRATE',
                returnValue: projectId,
                username: null,
                option2: null
            };
        }

        const periodValue = this.periodOptions.find((p) => p.period_id?.toString() === periodId?.toString());
        const periodName = periodValue?.period_name?.toString();

        const baseType = paymentFor === 'GROUP_LEADER' ? 'GROUPBULKPAYMENT' : 'WORKERBULKPAYMENT';

        if (mode === 'download') {
            return {
                returnType: baseType,
                returnValue: projectId,
                username: periodId.toString(),
                option2: periodName
            };
        }

        return {
            returnType: `GET${baseType}`,
            returnValue: this.selectedStatus,
            username: projectId,
            option2: periodName
        };
    }

    onReportFilterChange(): void {
        const params = this.getReportRequestParams('search');
        if (!params) return;

        this.loadDropdown(params.returnType, params.returnValue, params.username ?? null, 'recordReport', params.option2);
    }

    onProjectChange(data: any): void {
        this.fundForm.get('groupleader')?.reset('');
        this.fundForm.get('workerProfile')?.reset('');
        this.recordReport = [];
        this.resetUploadValidation();

        const projectId = data?.value;
        if (projectId === null || projectId === undefined || projectId === '') {
            this.groupLeaderOptions = [];
            this.workerOptions = [];
            return;
        }

        if (!this.isPaymentReport) {
            this.hasDemandSearchExecuted = false;
        }

        if (this.isPaymentReport) {
            this.loadDropdown('PROJECTBASEDWORKER', projectId, '', 'workerOptions');
        }
        const payload: DropdownParamter = {
            returnType: 'ACTIVEGROUPLEADER',
            returnValue: projectId.toString(),
            username: '',
            option1: this.companyId,
            option2: ''
        };
        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res) => (this.groupLeaderOptions = Array.isArray(res?.data) ? res.data : [])
        });
    }

    onPaymentForChange(): void {
        this.fundForm.get('groupleader')?.reset('');
        this.fundForm.get('workerProfile')?.reset('');
        this.recordReport = [];
        this.resetUploadValidation();
        this.updatePeriodValidation();
        this.refreshUploadTemplateHref();
    }

    onPaymentCriteriaChange(): void {
        this.resetUploadValidation();
    }

    private isExcludedRequisitionFor(row: any): boolean {
        const value = row?.requisition_for?.toString().toUpperCase().trim();
        return value === 'PAYMENT' || value === 'GROSS';
    }

    applyStatusFilter() {
        const selectedStatus = this.selectedStatus?.toString().toUpperCase().trim();

        if (!this.isPaymentReport) {
            if (!this.hasDemandSearchExecuted) {
                this.recordReport = [];
                return;
            }

            const projectName = this.fundForm.get('projectName')?.value;
            if (!projectName) {
                this.recordReport = [];
                return;
            }
            this.recordReport = this.filteredProducts.filter((i) => {
                const rowStatus = i?.requisition_status?.toString().toUpperCase().trim();
                const matchesStatus = !selectedStatus || rowStatus === selectedStatus;
                return matchesStatus && !this.isExcludedRequisitionFor(i);
            });
        } else {
            this.recordReport = this.filteredProducts.filter((i) => {
                const rowStatus = i?.requisition_status?.toString().toUpperCase().trim();
                return !selectedStatus || rowStatus === selectedStatus;
            });
        }
    }

    onRequestChange(event: any) {
        this.selectedStatus = event.value;

        if (this.isPaymentReport) {
            const params = this.getReportRequestParams('search');
            if (params) {
                this.runPaymentSearch();
                return;
            }
        }

        if (!this.isPaymentReport && !this.hasDemandSearchExecuted) {
            return;
        }

        this.applyStatusFilter();
    }

    onWorkerFilterChange(): void {
        if (!this.isPaymentReport) {
            return;
        }

        this.filteredProducts = this.applyPaymentClientFilters(this.allRecord);
        this.applyStatusFilter();
    }

    Onreturndropdowndetails() {
        if (this.isPaymentReport) {
            this.runPaymentSearch();
        } else {
            this.runDemandSearch();
        }
    }

    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
    }

    onFileUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const readFile = () => this.readFundAllocationFile(file, () => (input.value = ''));
        if (this.isPaymentReport) {
            readFile();
            return;
        }

        this.confirmationService.confirm({
            header: 'Upload Confirmation',
            message: `Are you sure you want to upload "${file.name}"?`,
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            accept: readFile,
            reject: () => (input.value = '')
        });
    }

    onFileDrop(event: DragEvent): void {
        event.preventDefault();
        this.isUploadDragOver = false;
        const file = event.dataTransfer?.files?.[0];
        if (file) this.readFundAllocationFile(file);
    }

    onFileDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isUploadDragOver = true;
    }

    onFileDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.isUploadDragOver = false;
    }

    private readFundAllocationFile(file: File, onComplete: () => void = () => undefined): void {
        if (!/\.xlsx?$/i.test(file.name)) {
            this.errorSuccess('Please upload an Excel file (.xlsx or .xls).');
            onComplete();
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            this.errorSuccess('The file exceeds the 10 MB upload limit.');
            onComplete();
            return;
        }
        if (this.isPaymentReport && !this.fundForm.get('paymentFor')?.value) {
            this.fundForm.get('paymentFor')?.markAsTouched();
            // this.fundForm.get('period')?.markAsTouched();
            this.errorSuccess('Select a upload type before validating a file.');
            onComplete();
            return;
        }

        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            try {
                const workbook = XLSX.read(event.target?.result, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' }) as any[][];
                const headers = (sheetRows[0] ?? []).map(
                    (column) =>
                        column
                            ?.toString()
                            .replace(/^\uFEFF/, '')
                            .trim() ?? ''
                );
                const sourceRows = sheetRows.slice(1);
                const data = sourceRows.map((row) => Object.fromEntries(headers.map((column, index) => [column, row[index] ?? ''])));
                if (data.length === 0) {
                    this.errorSuccess('The uploaded file has no data. Please check the file and try again.');
                    return;
                }

                if (this.isPaymentReport) {
                    if (this.selectedPaymentFor === 'WORKER_RATE') {
                        this.validateWorkerRateUpload(data, file.name, headers, sourceRows);
                    } else {
                        this.validatePaymentUpload(data, file.name, headers, sourceRows);
                    }
                } else {
                    const extraCols = ['Approved Date'];
                    this.excelColumns = Object.keys(data[0]).filter((column) => !extraCols.includes(column));
                    this.recordReport = data.map((item) => ({
                        ...Object.fromEntries(this.excelColumns.map((column) => [column, item[column] ?? ''])),
                        'Approved Date': item['Approved Date'] ?? ''
                    }));
                    this.isExcelUploaded = true;
                    this.submitFundAllocation(data);
                }
            } catch {
                this.errorSuccess('Failed to read the file. Please upload a valid Excel file (.xlsx / .xls).');
            } finally {
                onComplete();
            }
        };
        reader.onerror = () => {
            this.errorSuccess('File could not be read. Please try again.');
            onComplete();
        };
        reader.readAsArrayBuffer(file);
    }

    private validatePaymentUpload(data: any[], fileName: string, headers: string[], sourceRows: any[][]): void {
        this.resetUploadValidation();
        this.uploadFileName = fileName;
        this.hasUploadProcessed = false;
        const isWorkerUpload = this.selectedPaymentFor === 'WORKER';
        const typeColumn = isWorkerUpload ? 'Type(P/W)' : 'Type(P/G)';

        const requiredColumns = isWorkerUpload
            ? ['Period Id', 'Period Name', 'Site Id', 'Site Name', 'Group Leader Id', 'Group Leader Name', 'Worker Id', 'Worker Code', 'Worker Name', 'Worker Mobile', 'Worker Aadhaar', 'Head', 'Transaction Date', typeColumn, 'Active', 'Amount']
            : ['Period Id', 'Period Name', 'Site Id', 'Site Name', 'Group Leader Id', 'Group Leader Name', 'Head', 'Transaction Date', typeColumn, 'Active', 'Amount'];
        const missingColumns = requiredColumns.filter((column) => !headers.includes(column));

        for (const column of missingColumns) {
            this.uploadValidationIssues.push({ rowNumber: 1, column, value: '', issue: `Required column "${column}" is missing.`, type: 'Error' });
        }

        requiredColumns.forEach((column, index) => {
            if (headers[index] !== column && !missingColumns.includes(column)) {
                this.uploadValidationIssues.push({
                    rowNumber: 1,
                    column,
                    value: headers[index] ?? '',
                    issue: `Column ${String.fromCharCode(65 + index)} must be "${column}" but found "${headers[index] || 'blank'}".`,
                    type: 'Error'
                });
            }
        });

        const nonBlankRows: any[] = [];
        data.forEach((row, index) => {
            const values = sourceRows[index] ?? [];
            if (values.every((value) => value === null || value === undefined || value.toString().trim() === '')) {
                return;
            }

            nonBlankRows.push(row);
            const rowNumber = index + 2;
            const addIssue = (column: string, issue: string, type: UploadValidationIssue['type'], value = row[column]): void => {
                this.uploadValidationIssues.push({ rowNumber, column, value: value?.toString?.() ?? '', issue, type });
            };

            if (!isWorkerUpload) {
                row[typeColumn] = this.getTypeForHead(row['Head']);
            } else {
                row[typeColumn] = row[typeColumn]?.toString().trim().toUpperCase() ?? '';
            }

            requiredColumns.forEach((column, columnIndex) => {
                const value = values[columnIndex];
                if (value === null || value === undefined || value.toString().trim() === '') {
                    addIssue(column, `Cell ${String.fromCharCode(65 + columnIndex)} cannot be blank.`, 'Error', value);
                }
            });

            const allowedHeads = ['KHARCHI', 'ADVANCE', 'COOK_CHARGE', 'ADMIN_CHARGE', 'GROSS', 'HOME_ADVANCE', 'FARE_ADVANCE', 'PAYMENT', 'WRITE_OFF'];
            const normalizedHead = this.normalizePaymentHead(row['Head']);
            if (!allowedHeads.includes(normalizedHead)) {
                addIssue('Head', `Head is incorrect. Please refer download sample template`, 'Error');
            }

            const rawType = (values[requiredColumns.indexOf(typeColumn)] ?? '').toString().trim().toUpperCase();
            const expectedType = this.getTypeForHead(row['Head']);

            row[typeColumn] = isWorkerUpload ? rawType : expectedType;
            if (rawType && rawType !== expectedType) {
                addIssue(typeColumn, `Type must be ${expectedType} for Head "${row['Head']}".`, 'Error', rawType);
            }

            const amountValue = row['Amount']?.toString().trim();
            if (!amountValue || !Number.isFinite(Number(amountValue))) {
                addIssue('Amount', 'Amount should not be zero.', 'Error');
            } else if (Number(amountValue) === 0) {
                addIssue('Amount', 'Amount cannot be 0.', 'Error');
            }

            const transactionDate = row['Transaction Date']?.toString().trim() ?? '';
            if (transactionDate) {
                const parsedDate = this.parseUploadDate(transactionDate);

                if (!/^\d{2}\/\d{2}\/\d{4}$/.test(transactionDate)) {
                    addIssue('Transaction Date', 'Transaction Date should be in dd/mm/yyyy format.', 'Error');
                } else if (Number.isNaN(parsedDate.getTime())) {
                    addIssue('Transaction Date', 'Transaction Date is not a valid calendar date.', 'Error');
                } else {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (parsedDate > today) {
                        addIssue('Transaction Date', 'Transaction date is in the future.', 'Warning');
                    }
                }
            }

            const active = row['Active']?.toString().trim().toLowerCase();
            if (['false', '0', 'no', 'n', 'inactive'].includes(active)) {
                addIssue('Active', 'This record is marked inactive.', 'Warning');
            }
        });

        this.uploadedPaymentRows = nonBlankRows;
        this.uploadPreviewColumns = headers;
        this.isUploadValidated = true;
        if (nonBlankRows.length === 0) {
            this.errorSuccess('The uploaded file has no data rows. Please check the file and try again.');
            this.resetUploadValidation();
            return;
        }
        if (this.uploadErrorCount === 0) {
            if (!isWorkerUpload) {
                this.validateStagedGroupLeaderPayment();
                return;
            }
            this.validateStagedWorkerPayment();
        }
    }

    private validateWorkerRateUpload(data: any[], fileName: string, headers: string[], sourceRows: any[][]): void {
        this.resetUploadValidation();
        this.uploadFileName = fileName;
        const requiredColumns = ['Site Id', 'Site Name', 'Group Leader Id', 'Group Leader Name', 'Worker Id', 'Worker Code', 'Worker Name', 'Worker Mobile', 'Worker Aadhaar', 'Is Active', 'Trade', 'Rate'];
        const missingColumns = requiredColumns.filter((column) => !headers.includes(column));

        for (const column of missingColumns) {
            this.uploadValidationIssues.push({ rowNumber: 1, column, value: '', issue: `Required column "${column}" is missing.`, type: 'Error' });
        }
        requiredColumns.forEach((column, index) => {
            if (headers[index] !== column && !missingColumns.includes(column)) {
                this.uploadValidationIssues.push({
                    rowNumber: 1,
                    column,
                    value: headers[index] ?? '',
                    issue: `Column ${String.fromCharCode(65 + index)} must be "${column}" but found "${headers[index] || 'blank'}".`,
                    type: 'Error'
                });
            }
        });

        const nonBlankRows: any[] = [];
        data.forEach((row, index) => {
            const values = sourceRows[index] ?? [];
            if (values.every((value) => value === null || value === undefined || value.toString().trim() === '')) return;
            nonBlankRows.push(row);

            const rowNumber = index + 2;

            requiredColumns.forEach((column, columnIndex) => {
                const value = values[columnIndex];
                if (value === null || value === undefined || value.toString().trim() === '') {
                    this.uploadValidationIssues.push({
                        rowNumber,
                        column,
                        value: '',
                        issue: `Cell ${String.fromCharCode(65 + columnIndex)} cannot be blank.`,
                        type: 'Error'
                    });
                }
            });

            const profileId = row['Worker Id']?.toString().trim() ?? '';
            const rate = row['Rate']?.toString().trim() ?? '';
            if (profileId && (!/^\d+$/.test(profileId) || Number(profileId) <= 0)) {
                this.uploadValidationIssues.push({ rowNumber, column: 'Worker Id', value: profileId, issue: 'Worker Id must be a positive numeric profile ID.', type: 'Error' });
            }
            if (rate && !Number.isFinite(Number(rate))) {
                this.uploadValidationIssues.push({ rowNumber, column: 'Rate', value: rate, issue: 'Rate must be a valid number.', type: 'Error' });
            }
        });

        this.uploadedPaymentRows = nonBlankRows;
        this.uploadPreviewColumns = headers;
        this.isUploadValidated = true;
        if (nonBlankRows.length === 0) {
            this.errorSuccess('The uploaded file has no data rows. Please check the file and try again.');
            this.resetUploadValidation();
            return;
        }
        if (this.uploadErrorCount === 0) {
            this.processWorkerRateUpload('VALIDATE');
        }
    }

    get uploadErrorCount(): number {
        return this.uploadValidationIssues.filter((issue) => issue.type === 'Error').length;
    }

    get uploadWarningCount(): number {
        return this.uploadValidationIssues.filter((issue) => issue.type === 'Warning').length;
    }

    get validPaymentRowCount(): number {
        if (this.uploadValidationIssues.some((issue) => issue.type === 'Error' && issue.rowNumber === 1)) return 0;
        const invalidRows = new Set(this.uploadValidationIssues.filter((issue) => issue.type === 'Error' && issue.rowNumber > 1).map((issue) => issue.rowNumber));
        return Math.max(0, this.uploadedPaymentRows.length - invalidRows.size);
    }

    showUploadPreview(): void {
        if (!this.isUploadValidated || this.uploadErrorCount > 0 || this.validPaymentRowCount === 0 || this.isProcessingUpload || this.hasUploadProcessed) return;
        this.showUploadPreviewDialog = true;
    }

    processValidatedUpload(): void {
        if (!this.isUploadValidated || this.uploadErrorCount > 0 || this.validPaymentRowCount === 0 || this.isProcessingUpload || this.hasUploadProcessed) return;
        if (this.isPaymentReport && this.selectedPaymentFor === 'GROUP_LEADER') {
            this.processStagedGroupLeaderPayment();
            return;
        }
        if (this.isPaymentReport && this.selectedPaymentFor === 'WORKER') {
            this.processStagedWorkerPayment();
            return;
        }
        if (this.isPaymentReport && this.selectedPaymentFor === 'WORKER_RATE') {
            this.processWorkerRateUpload('PROCESS');
            return;
        }
        this.submitFundAllocation(this.uploadedPaymentRows);
    }

    resetUploadValidation(): void {
        this.uploadFileName = '';
        this.uploadedPaymentRows = [];
        this.uploadPreviewColumns = [];
        this.uploadValidationIssues = [];
        this.isUploadValidated = false;
        this.hasUploadProcessed = false;
        this.showUploadPreviewDialog = false;
    }

    private parseUploadDate(value: string): Date {
        const dayFirstDate = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
        if (!dayFirstDate) return new Date(value);

        const year = Number(dayFirstDate[3]) < 100 ? 2000 + Number(dayFirstDate[3]) : Number(dayFirstDate[3]);
        const date = new Date(year, Number(dayFirstDate[2]) - 1, Number(dayFirstDate[1]));
        if (date.getFullYear() !== year || date.getMonth() !== Number(dayFirstDate[2]) - 1 || date.getDate() !== Number(dayFirstDate[1])) {
            return new Date(Number.NaN);
        }
        return date;
    }

    submitFundAllocation(data: any[]) {
        const payload: FundAllocationUpload[] = data.map((row: any) => ({
            requisition_id: row['Requisition Id'],
            approved_amount: row['Approved Amount'] ?? ''
        }));
        this.runUpload(data.length, this.fundService.uploadApprovedAmount(this.uploadCompanyId, payload, this.uploadUserId));
    }

    private normalizePaymentHead(head: unknown): string {
        return (
            head
                ?.toString()
                .trim()
                .toUpperCase()
                .replace(/[\s-]+/g, '_') ?? ''
        );
    }

    private getTypeForHead(head: unknown): 'P' | 'G' | 'W' {
        const normalizedHead = this.normalizePaymentHead(head);
        if (normalizedHead === 'WRITE_OFF') {
            return 'W';
        }
        if (normalizedHead === 'GROSS') {
            return 'G';
        }
        return 'P';
    }

    private buildStagedGroupLeaderRows(data: any[]): GroupLeaderPaymentRow[] {
        return data.map((row: any) => ({
            period_id: Number(row['Period Id']),
            period_name: row['Period Name'] ?? '',
            project_id: Number(row['Site Id']),
            group_leader_id: Number(row['Group Leader Id']),
            site_name: row['Site Name'] ?? '',
            group_leader_name: row['Group Leader Name'] ?? '',
            head: this.normalizePaymentHead(row['Head']),
            transaction_date: row['Transaction Date']?.toString().trim() ?? '',
            transaction_type: this.getTypeForHead(row['Head']),
            active: ['N', 'NO', 'FALSE', '0', 'INACTIVE'].includes(row['Active']?.toString().trim().toUpperCase()) ? 'N' : 'Y',
            amount: Number(row['Amount']),
            remark: row['Remark']?.toString() ?? ''
        }));
    }

    private stageGroupLeaderPayment(operation: StageGroupLeaderPayment['p_operation'], data: GroupLeaderPaymentRow[] | null) {
        return this.fundService.stageGroupleaderPayment({
            p_company_id: this.uploadCompanyId,
            p_operation: operation,
            p_uploaded_file_name: this.uploadFileName,
            p_uploaded_by: this.uploadUserId,
            p_data: data
        });
    }

    private buildStagedWorkerRows(data: any[]): WorkerPaymentRow[] {
        return data.map((row: any) => ({
            period_id: row['Period Id']?.toString().trim() ?? '',
            profile_id: row['Worker Id']?.toString().trim() ?? '',
            project_id: row['Site Id']?.toString().trim() ?? '',
            group_id: row['Group Leader Id']?.toString().trim() ?? '',
            group_leader_name: row['Group Leader Name']?.toString().trim() ?? '',
            site_name: row['Site Name']?.toString().trim() ?? '',
            period_name: row['Period Name']?.toString().trim() ?? '',
            worker_code: row['Worker Code']?.toString().trim() ?? '',
            worker_mobile: row['Worker Mobile']?.toString().trim() ?? '',
            worker_aadhaar: row['Worker Aadhaar']?.toString().trim() ?? '',
            worker_name: row['Worker Name']?.toString().trim() ?? '',
            head: this.normalizePaymentHead(row['Head']),
            transaction_type: row['Type(P/W)']?.toString().trim().toUpperCase() ?? '',
            active: ['N', 'NO', 'FALSE', '0', 'INACTIVE'].includes(row['Active']?.toString().trim().toUpperCase()) ? 'N' : 'Y',
            amount: row['Amount']?.toString().trim() ?? '',
            remark: row['Remark']?.toString() ?? '',
            transaction_date: row['Transaction Date']?.toString().trim() ?? ''
        }));
    }

    private stageWorkerPayment(operation: StageWorkerPayment['p_operation'], data: WorkerPaymentRow[] | null) {
        return this.fundService.stageWorkerPayment({
            p_company_id: this.uploadCompanyId,
            p_operation: operation,
            p_uploaded_file_name: this.uploadFileName,
            p_uploaded_by: this.uploadUserId,
            p_data: data
        });
    }

    private validateStagedGroupLeaderPayment(): void {
        this.isProcessingUpload = true;
        this.isUploadValidated = false;
        this.stageGroupLeaderPayment('VALIDATE', this.buildStagedGroupLeaderRows(this.uploadedPaymentRows)).subscribe({
            next: (response: any) => {
                this.isProcessingUpload = false;
                const issues = this.readStageValidationIssues(response);
                if (issues.length) {
                    this.uploadValidationIssues.push(...issues);
                    this.isUploadValidated = true;
                    return;
                }

                this.isUploadValidated = true;
                this.showUploadPreviewDialog = true;
                this.showSuccess(`Validation complete. ${this.uploadedPaymentRows.length} row(s) are ready to process.`);
            },
            error: (error: any) => {
                this.isProcessingUpload = false;
                const issues = this.readStageValidationIssues(error);
                this.uploadValidationIssues.push(...(issues.length ? issues : [this.createStageRequestIssue(error)]));
                this.isUploadValidated = true;
            }
        });
    }

    private validateStagedWorkerPayment(): void {
        this.isProcessingUpload = true;
        this.isUploadValidated = false;
        this.stageWorkerPayment('VALIDATE', this.buildStagedWorkerRows(this.uploadedPaymentRows)).subscribe({
            next: (response: any) => {
                this.isProcessingUpload = false;
                const issues = this.readStageValidationIssues(response);
                if (issues.length) {
                    this.uploadValidationIssues.push(...issues);
                    this.isUploadValidated = true;
                    return;
                }

                this.isUploadValidated = true;
                this.showUploadPreviewDialog = true;
                this.showSuccess(`Validation complete. ${this.uploadedPaymentRows.length} row(s) are ready to process.`);
            },
            error: (error: any) => {
                this.isProcessingUpload = false;
                const issues = this.readStageValidationIssues(error);
                this.uploadValidationIssues.push(...(issues.length ? issues : [this.createStageRequestIssue(error)]));
                this.isUploadValidated = true;
            }
        });
    }

    private processStagedGroupLeaderPayment(): void {
        this.isProcessingUpload = true;
        this.stageGroupLeaderPayment('PROCESS', null).subscribe({
            next: (response: any) => {
                this.isProcessingUpload = false;
                const issues = this.readStageValidationIssues(response);
                if (issues.length) {
                    this.uploadValidationIssues.push(...issues);
                    this.showUploadPreviewDialog = false;
                    return;
                }
                this.hasUploadProcessed = true;
                this.showUploadPreviewDialog = false;
                this.showSuccess(response?.data?.message || `${this.uploadedPaymentRows.length} record(s) uploaded successfully.`);
            },
            error: (error: any) => {
                this.isProcessingUpload = false;
                const issues = this.readStageValidationIssues(error);
                this.uploadValidationIssues.push(...(issues.length ? issues : [this.createStageRequestIssue(error)]));
                this.showUploadPreviewDialog = false;
            }
        });
    }

    private processStagedWorkerPayment(): void {
        this.isProcessingUpload = true;
        this.stageWorkerPayment('PROCESS', null).subscribe({
            next: (response: any) => {
                this.isProcessingUpload = false;
                const issues = this.readStageValidationIssues(response);
                if (issues.length) {
                    this.uploadValidationIssues.push(...issues);
                    this.showUploadPreviewDialog = false;
                    return;
                }
                this.hasUploadProcessed = true;
                this.showUploadPreviewDialog = false;
                this.showSuccess(response?.data?.message || `${this.uploadedPaymentRows.length} record(s) uploaded successfully.`);
            },
            error: (error: any) => {
                this.isProcessingUpload = false;
                const issues = this.readStageValidationIssues(error);
                this.uploadValidationIssues.push(...(issues.length ? issues : [this.createStageRequestIssue(error)]));
                this.showUploadPreviewDialog = false;
            }
        });
    }

    private createStageRequestIssue(error: any): UploadValidationIssue {
        const detail = error?.error?.message ?? error?.error ?? error?.message ?? 'Backend validation request failed.';
        return {
            rowNumber: 1,
            column: '',
            value: '',
            issue: typeof detail === 'string' ? detail : JSON.stringify(detail),
            type: 'Error'
        };
    }

    private readStageValidationIssues(response: any): UploadValidationIssue[] {
        const payload = response?.error ?? response;
        const result = Array.isArray(payload?.data) && payload.data.length === 1 ? payload.data[0] : (payload?.data ?? payload);
        const body =
            result?.fn_stage_group_leader_payment ??
            result?.stage_group_leader_payment ??
            result?.fn_stage_worker_payment ??
            result?.stage_worker_payment ??
            result?.fn_bulk_update_worker_profile_rate ??
            result?.bulk_update_worker_profile_rate ??
            result;
        const status = (body?.status ?? body?.result ?? payload?.status)?.toString().toUpperCase();
        const listedIssues = body?.errors ?? body?.validation_errors ?? body?.validationErrors ?? body?.error_details ?? body?.error;
        const rawIssues = Array.isArray(listedIssues)
            ? listedIssues
            : listedIssues
              ? [typeof listedIssues === 'string' ? { message: listedIssues } : listedIssues]
              : Array.isArray(body) && body.some((entry: any) => entry?.error || entry?.error_message || entry?.message)
                ? body
                : [];
        const responseMessage = (body?.message ?? payload?.message ?? '').toString();
        const hasErrorStatus = payload?.success === false || body?.success === false || ['ERROR', 'FAILED', 'FAILURE', 'INVALID'].some((errorStatus) => status?.includes(errorStatus)) || /\b(error|failed|invalid)\b/i.test(responseMessage);

        const issues = rawIssues.map(
            (issue: any): UploadValidationIssue => ({
                rowNumber: Number(issue?.rowNumber ?? issue?.row_number ?? issue?.row_no ?? issue?.row ?? 1) || 1,
                column: (issue?.column ?? issue?.column_name ?? issue?.field ?? '').toString(),
                value: (issue?.value ?? issue?.error_value ?? '').toString(),
                issue: (issue?.message ?? issue?.error_message ?? issue?.error ?? issue?.detail ?? JSON.stringify(issue)).toString(),
                type: 'Error'
            })
        );

        if (issues.length) return issues;
        if (!hasErrorStatus) return [];

        const message = body?.message ?? body?.error ?? payload?.message ?? 'Backend validation failed.';
        return [
            {
                rowNumber: 1,
                column: '',
                value: '',
                issue: message.toString(),
                type: 'Error'
            }
        ];
    }

    private get uploadUserId(): number {
        return this.authService.isLogIntType()?.userid;
    }

    private get uploadCompanyId(): number {
        return this.authService.isLogIntType()?.companyid;
    }

    private runUpload(recordCount: number, upload$: Observable<any>) {
        this.isProcessingUpload = true;
        upload$.subscribe({
            next: (res: any) => {
                this.isProcessingUpload = false;
                const msg = res?.data?.message;
                this.showSuccess(msg || `${recordCount} record(s) uploaded successfully.`);
                if (this.isPaymentReport) {
                    this.hasUploadProcessed = true;
                    this.showUploadPreviewDialog = false;
                }
            },
            error: (err) => {
                this.isProcessingUpload = false;
                console.error(err);
                this.errorSuccess('Upload failed. Please check the file format and try again.');
            }
        });
    }

    private runDemandSearch(): void {
        this.hasDemandSearchExecuted = false;

        const payload: DropdownParamter = {
            returnType: 'REQINPUT',
            returnValue: null,
            username: '',
            option1: this.companyId,
            option2: ''
        };

        const startDate = this.fundForm.controls['startDate'].value;
        const endDate = this.fundForm.controls['endDate'].value;
        const groupleader = this.fundForm.controls['groupleader'].value;
        const selectedProjectValue = this.fundForm.controls['projectName'].value;
        const selectedProjectOption = this.projectNameOptions.find((p: any) => p?.project_id?.toString() === selectedProjectValue?.toString());
        const selectedProjectName = selectedProjectOption?.project_name?.toString().toLowerCase().trim();

        const from = new Date(startDate);
        const to = new Date(endDate);
        from.setHours(0, 0, 0, 0);
        to.setHours(0, 0, 0, 0);

        if (to < from) {
            this.errorSuccess('To Date must be greater than or equal to From Date.');
            return;
        }

        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res: any) => {
                const data = Array.isArray(res?.data) ? res.data : [];
                this.allRecord = [...data];

                let filtered = [...data];

                filtered = filtered.filter((row) => {
                    const rowProjectId = row['project_id']?.toString();
                    const rowProjectName = row['project_name']?.toString().toLowerCase().trim();
                    const selectedProjectId = selectedProjectValue?.toString();
                    const selectedProjectAsName = selectedProjectValue?.toString().toLowerCase().trim();

                    return rowProjectId === selectedProjectId || rowProjectName === selectedProjectName || rowProjectName === selectedProjectAsName;
                });

                if (groupleader) {
                    filtered = filtered.filter((row) => row['group_leader_name']?.toString().toLowerCase().trim() === groupleader?.toString().toLowerCase().trim());
                }

                if (startDate && endDate) {
                    filtered = filtered.filter((row) => {
                        const rowDate = new Date(row['requested_on']);
                        rowDate.setHours(0, 0, 0, 0);
                        return rowDate >= from && rowDate <= to;
                    });
                }

                this.filteredProducts = filtered;
                this.hasDemandSearchExecuted = true;
                this.applyStatusFilter();

                if (this.recordReport.length === 0) {
                    this.showSuccess('No Data Available for the selected filters.');
                }
            },
            error: (err) => {
                console.error(err);
                this.recordReport = [];
                this.filteredProducts = [];
                this.allRecord = [];
                this.hasDemandSearchExecuted = false;
                this.errorSuccess('Error searching data. Please try again.');
            }
        });
    }

    private runPaymentSearch(): void {
        const params = this.getReportRequestParams('search');
        if (!params) {
            this.fundForm.get('period')?.markAsTouched();
            this.fundForm.get('paymentFor')?.markAsTouched();
            if (this.selectedPaymentFor === 'WORKER') {
                this.fundForm.get('projectName')?.markAsTouched();
            }
            this.errorSuccess(this.selectedPaymentFor === 'WORKER' ? 'Period, Payment For, and Site are required for Worker payments.' : 'Period and Payment For are required.');
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
                const data = Array.isArray(res?.data) ? res.data : [];
                this.allRecord = [...data];
                this.filteredProducts = this.applyPaymentClientFilters(data);
                this.applyStatusFilter();

                if (this.recordReport.length === 0) {
                    this.showSuccess('No Data Available for the selected filters.');
                }
            },
            error: (err) => {
                console.error(err);
                this.recordReport = [];
                this.allRecord = [];
                this.filteredProducts = [];
                this.errorSuccess('Error searching data. Please try again.');
            }
        });
    }

    private applyPaymentClientFilters(data: any[]): any[] {
        let filtered = [...data];

        const selectedProjectId = this.fundForm.get('projectName')?.value?.toString();
        const selectedProjectOption = this.projectNameOptions.find((p: any) => p?.project_id?.toString() === selectedProjectId);
        const selectedProjectName = selectedProjectOption?.project_name?.toString().toLowerCase().trim();

        if (selectedProjectId || selectedProjectName) {
            filtered = filtered.filter((row) => {
                const rowProjectId = row['project_id']?.toString();
                const rowProjectName = row['project_name']?.toString().toLowerCase().trim();
                return rowProjectId === selectedProjectId || (selectedProjectName ? rowProjectName === selectedProjectName : false);
            });
        }

        const selectedPeriodId = this.fundForm.get('period')?.value?.toString();
        const selectedPeriodOption = this.periodOptions.find((p: any) => p?.period_id?.toString() === selectedPeriodId);
        const selectedPeriodName = selectedPeriodOption?.period_name?.toString().toLowerCase().trim();

        if (selectedPeriodId || selectedPeriodName) {
            filtered = filtered.filter((row) => {
                const rowPeriodId = row['period_id']?.toString();
                const rowPeriodName = (row['periodname'] ?? row['period_name'])?.toString().toLowerCase().trim();
                return rowPeriodId === selectedPeriodId || (selectedPeriodName ? rowPeriodName === selectedPeriodName : false);
            });
        }

        const groupleader = this.fundForm.get('groupleader')?.value;
        if (this.selectedPaymentFor === 'GROUP_LEADER' && groupleader) {
            const target = groupleader.toString().toLowerCase().trim();
            filtered = filtered.filter((row) => row['group_leader_name']?.toString().toLowerCase().trim().includes(target));
        }

        const selectedWorkerValue = this.fundForm.get('workerProfile')?.value;
        const selectedProfileId = Number(selectedWorkerValue);
        const selectedWorkerOption = this.workerOptions.find((w) => w.profileid?.toString() === selectedWorkerValue?.toString());
        const selectedWorkerName = selectedWorkerOption?.worker_name?.toString().toLowerCase().split('-')[0]?.trim();

        if (this.selectedPaymentFor === 'WORKER' && selectedWorkerValue !== null && selectedWorkerValue !== undefined && selectedWorkerValue !== '') {
            filtered = filtered.filter((row) => {
                const rowProfileId = this.getWorkerProfileId(row);
                const rowWorkerName = (row?.worker_name ?? row?.profile_name ?? row?.workername)?.toString().toLowerCase().trim();
                const matchesById = Number.isFinite(selectedProfileId) && selectedProfileId > 0 && rowProfileId === selectedProfileId;
                const matchesByName = !!selectedWorkerName && !!rowWorkerName && rowWorkerName.includes(selectedWorkerName);
                return matchesById || matchesByName;
            });
        }

        return filtered;
    }

    reset() {
        const isPaymentMode = this.isPaymentReport;
        this.fundForm.reset({
            startDate: this.today,
            endDate: this.today,
            projectName: '',
            groupleader: '',
            workerProfile: '',
            period: '',
            paymentFor: 'GROUP_LEADER',
            reportType: isPaymentMode ? 'payment' : 'demand'
        });
        this.groupLeaderOptions = [];
        this.recordReport = [];
        this.filteredProducts = [];
        this.allRecord = [];
        this.excelColumns = [];
        this.isExcelUploaded = false;
        this.hasDemandSearchExecuted = false;
        this.selectedStatus = isPaymentMode ? 'APPROVED' : 'PENDING';
        this.isProcessingUpload = false;
        this.resetUploadValidation();
        this.refreshUploadTemplateHref();
    }

    private buildWorksheetData(data: any[]): any[] {
        if (!this.isPaymentReport) {
            return data.map((row: any) => ({
                'Requisition Id': row.requisition_id ?? '',
                'Site Name': row.project_name ?? '',
                'Group Leader Name': row.group_leader_name ?? '',
                'Requisition Date': this.datePipe.transform(row.requested_on, 'dd/MM/yyyy') || '',
                'Requisition For': row.requisition_for ?? '',
                'No of Worker': row.worker_count ?? '',
                Amount: row.amount ?? '',
                'Approved Amount': row.approved_amount ?? '',
                Status: row.requisition_status ?? ''
            }));
        }

        const paymentFor = this.fundForm.get('paymentFor')?.value;

        if (paymentFor === 'WORKER_RATE') {
            return data.map((row: any) => ({
                'Site Id': row.project_id ?? '',
                'Site Name': row.project_name ?? '',
                'Group Leader Id': row.group_leader_id ?? '',
                'Group Leader Name': row.group_leader_name ?? '',
                'Worker Id': row.profileid ?? '',
                'Worker Code': row.worker_code ?? '',
                'Worker Name': row.worker_name ?? '',
                'Worker Mobile': row.mobileno ?? '',
                'Worker Aadhaar': row.aadhaar_no ?? '',
                'Is Active': row.isactive ?? '',
                Trade: row.trade ?? '',
                Rate: row.rate ?? ''
            }));
        }

        if (paymentFor === 'GROUP_LEADER') {
            return data.map((row: any) => ({
                'Period Id': row.period_id ?? '',
                'Period Name': row.period_name ?? '',
                'Site Id': row.project_id ?? '',
                'Site Name': row.project_name ?? '',
                'Group Leader Id': row.groupleader_id ?? '',
                'Group Leader Name': row.groupleader_name ?? '',
                Head: row.head ?? '',
                'Transaction Date': this.datePipe.transform(row.transaction_date, 'dd/MM/yyyy') || '',
                'Type(P/G)': this.getTypeForHead(row.head),
                Active: row.isactive ?? '',
                Amount: row.amount ?? '',
                Remark: row.remarks ?? ''
            }));
        }

        // WORKER
        return data.map((row: any) => ({
            'Period Id': row.period_id ?? '',
            'Period Name': row.period_name ?? '',
            'Site Id': row.project_id ?? '',
            'Site Name': row.project_name ?? '',
            'Group Leader Id': row.group_leader_id ?? '',
            'Group Leader Name': row.group_leader_name ?? '',
            'Worker Id': row.profileid ?? '',
            'Worker Code': row.worker_code ?? '',
            'Worker Name': row.worker_name ?? '',
            'Worker Mobile': row.mobileno ?? '',
            'Worker Aadhaar': row.aadhaar_no ?? '',
            Head: row.head ?? '',
            'Transaction Date': this.datePipe.transform(row.transaction_date, 'dd/MM/yyyy') || '',
            'Type(P/W)': row.type_p_g ?? '',
            Active: row.isactive ?? '',
            Amount: row.amount ?? '',
            Remark: row.remarks ?? ''
        }));
    }

    onDownloadClick(): void {
        if (this.downloadValidationMessage) {
            this.fundForm.get('paymentFor')?.markAsTouched();
            this.fundForm.get('period')?.markAsTouched();
            this.fundForm.get('projectName')?.markAsTouched();
            return;
        }
        this.downloadExcel();
    }

    downloadExcel() {
        const params = this.getReportRequestParams('download');
        if (!params) {
            this.errorSuccess(this.downloadValidationMessage);
            return;
        }
        const payload: DropdownParamter = {
            returnType: params.returnType,
            returnValue: params.returnType === 'REQINPUT' ? this.selectedStatus : params.returnValue,
            username: params.username ?? null,
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

                const worksheetData = this.buildWorksheetData(data);
                if (!worksheetData.length) {
                    this.errorSuccess('No data available for the selected filters.');
                    return;
                }
                const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Fund Allocation');

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
        const projectName = this.fundForm.get('projectName')?.value || 'Project';
        const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd_HH-mm');

        let fileName = `${projectName}_Report_${currentDate}`;
        return fileName;
    }

    showSuccess(message: string) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
    }

    errorSuccess(message: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
    }
}
