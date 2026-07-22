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
import { StockIn } from '@/types/stockin.model';
import { InventoryService } from '@/core/services/inventory.service';
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
import { FundAllocationUpload } from '@/core/models/fundallocation.model';

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
    excelColumns: string[] = [];
    isExcelUploaded: boolean = false;
    recordReport: any[] = [];
    requestOptions: any[] = [
        { fieldid: 'APPROVED', fieldname: 'APPROVED' },
        { fieldid: 'PENDING', fieldname: 'PENDING' },
        { fieldid: 'REJECTED', fieldname: 'REJECTED' }
    ];
    selectedStatus: string = 'PENDING';

    constructor(
        private fb: FormBuilder,
        private inventoryService: InventoryService,
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
            fund: []
        });
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.loadDropdown('ACTIVEPROJECT', '', 'projectNameOptions');
        this.loadDropdown('REQINPUT', null, 'recordReport');
        this.loadDropdownMaster();
    }

    loadDropdown(type: string, value: string | null, key: 'projectNameOptions' | 'recordReport') {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: '',
            option1: this.companyId,
            option2: ''
        };
        const $api = type==='ACTIVEPROJECT'? this.setupService.onDropdownDetailsPublic(payload) : this.setupService.onDropdownDetails(payload);
        $api.subscribe({
            next: (res) => {
                this[key] = res.data;
                if (key === 'recordReport') {
                    this.allRecord = [...res.data];
                    this.filteredProducts = res.data;
                    this.applyStatusFilter();
                }
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

    applyStatusFilter() {
        if (this.selectedStatus) {
            this.recordReport = this.filteredProducts.filter((i) => i.requisition_status === this.selectedStatus);
        } else {
            this.recordReport = [...this.filteredProducts];
        }
    }

    onRequestChange(event: any) {
        this.selectedStatus = event.value;
        this.applyStatusFilter();
    }

    Onreturndropdowndetails() {
        const startDate = this.fundForm.controls['startDate'].value;
        const endDate = this.fundForm.controls['endDate'].value;
        const groupleader = this.fundForm.controls['groupleader'].value;
        const projectName = this.fundForm.controls['projectName'].value;

        const from = new Date(startDate);
        const to = new Date(endDate);
        from.setHours(0, 0, 0, 0);
        to.setHours(0, 0, 0, 0);

        if (to < from) {
            this.errorSuccess('To Date must be greater than or equal to From Date.');
            return;
        }

        let filtered = [...this.allRecord];

        if (projectName) {
            filtered = filtered.filter((row) => row['project_name']?.toString().toLowerCase().trim() === projectName?.toString().toLowerCase().trim());
        }

        if (groupleader) {
            filtered = filtered.filter((row) => row['group_leader_name']?.toString().toLowerCase().trim() === groupleader?.toString().toLowerCase().trim());
        }

        // ✅ Only apply date filter if user changed from default today
        const todayStr = this.datePipe.transform(this.today, 'yyyy-MM-dd');
        const fromStr = this.datePipe.transform(from, 'yyyy-MM-dd');
        const toStr = this.datePipe.transform(to, 'yyyy-MM-dd');
        const isDefaultDate = fromStr === todayStr && toStr === todayStr;

        if (startDate && endDate && !isDefaultDate) {
            filtered = filtered.filter((row) => {
                const rowDate = new Date(row['requested_on']);
                rowDate.setHours(0, 0, 0, 0);
                return rowDate >= from && rowDate <= to;
            });
        }

        this.filteredProducts = filtered;
        this.applyStatusFilter();

        if (filtered.length === 0) {
            this.showSuccess('No Data Available for the selected filters.');
        }
    }

    onPageChange(event: any) {
        this.first = event.first;
        this.rowsPerPage = event.rows;
    }

    // link(event: Event) {
    //     const worksheet = XLSX.utils.json_to_sheet([
    //         {
    //             'Requisition Id': '',
    //             'Project Name': '',
    //             'Group Name': '',
    //             'Group Mobile No': '',
    //             'Active Worker': '',
    //             'Present Worker': '',
    //             'Requisition For': '',
    //             'No of Worker': '',
    //             Amount: ''
    //         }
    //     ]);
    //     const workbook = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(workbook, worksheet, 'Fund Allocation');
    //     const excelBuffer = XLSX.write(workbook, {
    //         bookType: 'xlsx',
    //         type: 'array'
    //     });
    //     const blob = new Blob([excelBuffer], {
    //         type: 'application/octet-stream'
    //     });
    //     saveAs(blob, 'Fund_Allcation_Template.xlsx');
    // }

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
        const username = this.authService.isLogIntType()?.userid?.toString();
        const payload: FundAllocationUpload[] = data.map((row: any) => ({
            requisition_id: row['Requisition Id'],
            approved_amount: row['Approved Amount'] ?? ''
        }));
        this.fundService.uploadApprovedAmount(payload, username).subscribe({
            next: (res: any) => {
                const msg = res?.data?.error_message;
                this.showSuccess(msg || `${data.length} record(s) uploaded successfully.`);
            },
            error: (err) => {
                console.error(err);
                this.errorSuccess('Upload failed. Please check the file format and try again.');
            }
        });
    }

    reset() {
        this.fundForm.reset();
        this.recordReport = [...this.allRecord];
        this.filteredProducts = [...this.allRecord];
        this.excelColumns = [];
        this.isExcelUploaded = false;
        this.selectedStatus = 'PENDING';
        this.applyStatusFilter();
    }

    downloadExcel() {
        const username = this.authService.isLogIntType()?.userid;
        const payload = {
            returnType: 'REQINPUT',
            returnValue: 'PENDING',
            username: username.toString(),
            option1: this.companyId,
            option2: ''
        };

        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res: any) => {
                const data = res?.data || [];
                if (!data || data.length === 0) {
                    this.errorSuccess('No data available to download.');
                    return;
                }
                const worksheetData = data.map((row: any) => ({
                    'Requisition Id': row.requisition_id ?? '',
                    'Project Name': row.project_name ?? '',
                    'Group Leader Name': row.group_leader_name ?? '',
                    'Requisition Date': this.datePipe.transform(row.requested_on, 'dd/MM/yyyy') || '',
                    'Requisition For': row.requisition_for ?? '',
                    'No of Worker': row.worker_count ?? '',
                    Amount: row.amount ?? '',
                    'Approved Amount': row.approved_amount ?? ''
                }));

                const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Fund Allocation');

                const excelBuffer = XLSX.write(workbook, {
                    bookType: 'xlsx',
                    type: 'array'
                });

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
