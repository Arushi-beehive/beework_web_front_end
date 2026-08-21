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
import { FundService } from '@/core/services/fund.service';
import { FundAllocationUpload, PaymentGroupLeaderUpload, PaymentWorkerUpload } from '@/core/models/fundallocation.model';
import { Observable } from 'rxjs';

interface FundAllocation {
    [key: string]: any;
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
        { label: 'Group Leader', value: 'GROUP_LEADER' },
        { label: 'Worker', value: 'WORKER' }
    ];

    selectedStatus: string | null = 'PENDING';
    periodOptions: any[] = [];
    private hasDemandSearchExecuted: boolean = false;

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
            projectName: ['', Validators.required],
            groupleader: [],
            workerProfile: [],
            fund: [],
            period: [''],
            paymentFor: [''],
            reportType: ['', Validators.required]
        });
        this.updatePeriodValidation();
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.loadDropdown('ACTIVEPROJECT', '', '', 'projectNameOptions');
        this.loadDropdown('PERIOD', '', '', 'periodOptions');
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
            this.fundForm.get('groupleader')?.reset('');
            this.fundForm.get('workerProfile')?.reset('');
            this.workerOptions = [];
            this.updatePeriodValidation();
        }
    }

    private updatePeriodValidation() {
        const periodControl = this.fundForm.get('period');
        const paymentfor = this.fundForm.get('paymentFor');
        const project = this.fundForm.get('projectName');
        if (!periodControl) return;

        if (this.isPaymentReport) {
            periodControl.setValidators([Validators.required]);
            paymentfor?.setValidators([Validators.required]);
            project?.setValidators([Validators.required]);
        } else {
            periodControl.clearValidators();
            paymentfor?.clearValidators();
            project?.clearValidators();
        }

        periodControl.updateValueAndValidity();
        paymentfor?.updateValueAndValidity();
    }

    get isPaymentReport(): boolean {
        return this.fundForm?.get('reportType')?.value === 'payment';
    }

    get selectedPaymentFor(): string {
        return this.fundForm.get('paymentFor')?.value;
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
                if(type=== 'PROJECTBASEDWORKER'){
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

    private getReportRequestParams(mode: 'search' | 'download' = 'search'): { returnType: string; returnValue: string | null; username?: string; option2: string } | null {
        if (!this.isPaymentReport) {
            return { returnType: 'REQINPUT', returnValue: null, option2: '' };
        }

        const paymentFor = this.fundForm.get('paymentFor')?.value;
        const projectId = this.fundForm.get('projectName')?.value?.toString();
        const periodId = this.fundForm.get('period')?.value;

        if (!paymentFor || !projectId || !periodId) {
            return null;
        }

        const periodValue = this.periodOptions.find((p) => p.period_id === periodId);
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
       
        if (!this.isPaymentReport) {
            this.hasDemandSearchExecuted = false;
        }

        if (this.isPaymentReport) {
            this.loadDropdown('PROJECTBASEDWORKER', data.value, '', 'workerOptions');
        }
         const payload: DropdownParamter = {
              returnType: 'ACTIVEGROUPLEADER',
              returnValue: data.value.toString(),
              username:'',
              option1: this.companyId,
              option2: ''
          };
          this.setupService.onDropdownDetails(payload).subscribe({
            next:(res)=> this.groupLeaderOptions = res.data
          })
    }

    onPaymentForChange(): void {
        this.fundForm.get('groupleader')?.reset('');
        this.fundForm.get('workerProfile')?.reset('');
        this.recordReport = [];
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
    
    onFileUpload(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        this.confirmationService.confirm({
            header: 'Upload Confirmation',
            message: `Are you sure you want to upload "${file.name}"?`,
            acceptLabel: 'Yes',
            rejectLabel: 'Cancel',
            accept: () => {
                const reader = new FileReader();

                reader.onload = (e: any) => {
                    try {
                        const binaryStr = e.target.result;
                        const workbook = XLSX.read(binaryStr, { type: 'binary' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                        if (!data || data.length === 0) {
                            this.errorSuccess('The uploaded file has no data. Please check the file and try again.');
                            event.target.value = '';
                            return;
                        }

                        const extraCols = ['Approved Date'];
                        this.excelColumns = Object.keys(data[0] as object).filter((col) => !extraCols.includes(col));

                        this.recordReport = data.map((item: any) => {
                            const row: any = {};
                            this.excelColumns.forEach((col) => {
                                row[col] = item[col] ?? '';
                            });
                            row['Approved Date'] = item['Approved Date'] ?? '';
                            return row;
                        });

                        this.isExcelUploaded = true;
                        this.submitFundAllocation(data);
                    } catch (err) {
                        this.errorSuccess('Failed to read the file. Please upload a valid Excel file (.xlsx / .xls).');
                    }

                    event.target.value = '';
                };

                reader.onerror = () => {
                    this.errorSuccess('File could not be read. Please try again.');
                    event.target.value = '';
                };

                reader.readAsBinaryString(file);
            },
            reject: () => {
                event.target.value = '';
            }
        });
    }
    submitFundAllocation(data: any[]) {
        if (this.isPaymentReport && this.selectedPaymentFor === 'GROUP_LEADER') {
            this.submitPaymentGroupLeaderUpload(data);
            return;
        }

        if (this.isPaymentReport && this.selectedPaymentFor === 'WORKER') {
            this.submitPaymentWorkerUpload(data);
            return;
        }

        const payload: FundAllocationUpload[] = data.map((row: any) => ({
            requisition_id: row['Requisition Id'],
            approved_amount: row['Approved Amount'] ?? ''
        }));
        this.runUpload(data.length, this.fundService.uploadApprovedAmount(this.uploadCompanyId, payload, this.uploadUserId));
    }

    private submitPaymentGroupLeaderUpload(data: any[]) {
        const payload: PaymentGroupLeaderUpload[] = data.map((row: any) => ({
            period_id: Number(row['Period Id']),
            period_name: row['Period Name'] ?? '',
            profile_id: Number(row['Group Leader Id']),
            profile_name: row['Group Leader Name'] ?? '',
            project_id: Number(row['Project Id']),
            project_name: row['Site Name'] ?? '',
            uploaded_amount: Number(row['Amount']) || 0,
            Type_P_G: row['Type(P/G)'] ?? ''
        }));

        this.runUpload(data.length, this.fundService.uploadPaymentGroupLeader(this.uploadCompanyId, payload, this.uploadUserId));
    }

    private submitPaymentWorkerUpload(data: any[]) {
        const payload: PaymentWorkerUpload[] = data.map((row: any) => ({
            period_id: Number(row['Period Id']),
            period_name: row['Period Name'] ?? '',
            profile_id: Number(row['Profile Id']),
            profile_code: row['Worker Code'] ?? '',
            group_id: Number(row['Group Id']),
            group_name: row['Group Leader Name'] ?? '',
            profile_name: row['Worker Name'] ?? '',
            project_id: Number(row['Project Id']),
            project_name: row['Site Name'] ?? '',
            uploaded_amount: Number(row['Amount']) || 0,
            Type_P_G: row['Type(P/G)'] ?? ''
        }));

        this.runUpload(data.length, this.fundService.uploadPaymentWorker(this.uploadCompanyId, payload, this.uploadUserId));
    }

    private get uploadUserId(): number {
        return this.authService.isLogIntType()?.userid;
    }

    private get uploadCompanyId(): number {
        return this.authService.isLogIntType()?.companyid;
    }

    private runUpload(recordCount: number, upload$: Observable<any>) {
        upload$.subscribe({
            next: (res: any) => {
                const msg = res?.data?.message;
                this.showSuccess(msg || `${recordCount} record(s) uploaded successfully.`);
            },
            error: (err) => {
                console.error(err);
                this.errorSuccess('Upload failed. Please check the file format and try again.');
            }
        });
    }

    private runDemandSearch(): void {
        this.hasDemandSearchExecuted = false;

        if (!this.fundForm.get('projectName')?.value) {
            this.fundForm.get('projectName')?.markAsTouched();
            this.errorSuccess('Site is required.');
            return;
        }

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
                    filtered = filtered.filter(
                        (row) => row['group_leader_name']?.toString().toLowerCase().trim() === groupleader?.toString().toLowerCase().trim()
                    );
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
            this.fundForm.get('projectName')?.markAsTouched();
            this.fundForm.get('paymentFor')?.markAsTouched();
            this.errorSuccess('Site, Period and Payment For are required.');
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
            workerProfile: '',
        });
        this.groupLeaderOptions = [];
        this.recordReport = [];
        this.filteredProducts = [];
        this.allRecord = [];
        this.excelColumns = [];
        this.isExcelUploaded = false;
        this.hasDemandSearchExecuted = false;
        this.selectedStatus = isPaymentMode ? 'APPROVED' : 'PENDING';
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

        if (paymentFor === 'GROUP_LEADER') {
            return data.map((row: any) => ({
                'Period Id': row.period_id ?? '',
                'Project Id': row.project_id ?? '',
                'Group Leader Id': row.groupleader_id ?? '',
                'Period Name': row.period_name ?? '',
                'Site Name': row.project_name ?? '',
                'Group Leader Name': row.groupleader_name ?? '',
                'Type(P/G)': row.type_p_g ?? '',
                Active: row.isactive ?? '',
                Amount: row.amount ?? ''
            }));
        }

        // WORKER
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
            Amount: row.amount ?? ''
        }));
    }

    downloadExcel() {
        const params = this.getReportRequestParams('download');
        if (!params) {
            this.errorSuccess('Please select Site, Period and Payment For before downloading.');
            return;
        }
        const payload: DropdownParamter = {
            returnType: params.returnType,
            returnValue: params.returnType === 'REQINPUT' ? this.selectedStatus : params.returnValue,
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

                const worksheetData = this.buildWorksheetData(data);
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
