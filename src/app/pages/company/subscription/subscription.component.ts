import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { AuthService } from '@/core/services/auth.service';
import { DropdownParamter } from '@/core/models/setup.model';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { CompanySubscriptionUpsertParamter } from '@/core/models/profile.model';
import { CompanyService } from '@/core/services/company.service';

@Component({
    selector: 'app-subscription',
    standalone: true,
    templateUrl: './subscription.component.html',
    styleUrls: ['./subscription.component.scss'],
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, DropdownModule, CalendarModule, InputTextModule, TableModule, TagModule, DialogModule, ToastModule, ConfirmDialogModule, GlobalFilterComponent],
    providers: [MessageService, ConfirmationService]
})
export class SubscriptionComponent implements OnInit {
    // Main table
    subscriptions: any[] = [];
    filteredSubscriptions: any[] = [];
    flattenedRows: any[] = [];
    globalFilter = '';
    companyId = '';
    showGlobalSearch = true;
    today: Date = new Date();
    minDate: Date = (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    })();

    visibleDialog = false;
    companyForm!: FormGroup;
    moduleForm!: FormGroup;
    innerRows: any[] = [];
    companyOptions = [];
    moduleOptions: any[] = [];
    primaryContact = [];
    moduleStartDate = [];
    tenureOptions = [
        { label: '1 Month', value: 1 },
        { label: '3 Months', value: 3 },
        { label: '6 Months', value: 6 },
        { label: '1 Year', value: 12 },
        { label: '2 Year', value: 24 },
        { label: '3 Year', value: 36 },
        { label: '4 Year', value: 48 },
        { label: '5 Year', value: 60 }
    ];

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private authService: AuthService,
        private setupService: SetupMaintainceService,
        private companyService: CompanyService
    ) {}

    ngOnInit() {
        this.companyId = this.authService.isLogIntType().companyid.toString();
        this.initCompanyForm();
        this.initModuleForm();
        this.loadDropdown('MODULE', '', 'moduleOptions');
        this.loadDropdown('COMPANYPROFILEDD', '', 'companyOptions');
        this.loadDropdown('SUBSCRIPTIONTENURE', '', 'filteredSubscriptions', (data) => {
            this.flattenedRows = [...data];
        });
    }

    initCompanyForm() {
        this.companyForm = this.fb.group({
            companyName: ['', [Validators.required, Validators.maxLength(100)]],
            adminName: ['', [Validators.required, Validators.maxLength(100)]],
            mobileNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
            email: ['', [Validators.required, Validators.email]]
        });
    }

    initModuleForm() {
        this.moduleForm = this.fb.group({
            module: [{ value: null, disabled: true }, Validators.required],
            tenure: [null, Validators.required],
            startDate: [{ value: '', disabled: true }]
        });
    }

    get cf() {
        return this.companyForm.controls;
    }
    get f() {
        return this.moduleForm.controls;
    }

    allowOnlyDigits(event: KeyboardEvent) {
        if (!/[0-9]/.test(event.key)) {
            event.preventDefault();
        }
    }

    private formatDate(date: Date): string {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    loadDropdown(type: string, value: string, key: 'moduleOptions' | 'companyOptions' | 'primaryContact' | 'moduleStartDate' | 'filteredSubscriptions', callback?: (res: any) => void) {
        const userId = this.authService.isLogIntType()?.userid;
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: userId,
            option1: this.companyId,
            option2: ''
        };
        this.setupService.onDropdownDetailsPublic(payload).subscribe({
            next: (res) => {
                this[key] = res.data;
                callback?.(res.data);
            }
        });
    }
    // ── Dialog ──────────────────────────────────────────
    openDialog() {
        this.innerRows = [];
        this.initCompanyForm();
        this.initModuleForm();
        this.visibleDialog = true;
    }

    // ── Inner table (inside dialog) ──────────────────────
    addInnerRow() {
        if (this.moduleForm.invalid) {
            this.moduleForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Fill all fields before adding.' });
            return;
        }

        const { module, tenure, startDate } = this.moduleForm.getRawValue();

        if (this.innerRows.find((r) => r.module === module)) {
            this.messageService.add({ severity: 'warn', summary: 'Duplicate', detail: `Module already added.` });
            return;
        }

        // find the full option object to get icon/label for display
        const moduleOption = this.moduleOptions.find((m: any) => m.module_id === module);
        console.log(moduleOption);
        const end = new Date(startDate);
        end.setMonth(end.getMonth() + tenure.value);

        this.innerRows = [
            ...this.innerRows,
            {
                module: module,
                moduleLabel: moduleOption?.module_code,
                tenureVal: tenure.value,
                tenureLbl: tenure.label,
                startDate: new Date(startDate),
                endDate: end
            }
        ];

        this.moduleForm.reset({ startDate: '' });
        this.messageService.add({ severity: 'success', summary: 'Added', detail: `Module added.` });
    }

    removeInnerRow(row: any) {
        this.innerRows = this.innerRows.filter((r) => r !== row);
    }

    onComapnyChange(data: any) {
        if (data.value) {
    this.moduleForm.get('module')?.enable();
     this.loadDropdown('PRIMARYCONTACT', data.value.companyid.toString(), 'primaryContact', (result) => {
            if (result && result.length > 0) {
                const contact = result[0];
                this.companyForm.patchValue({
                    mobileNo: contact.mobileno,
                    adminName: contact.fullname,
                    email: contact.emailid
                });
            }
        });
  } else {
    this.moduleForm.get('module')?.reset();
    this.moduleForm.get('module')?.disable();
  }
    }

    onModuleChange(data: any) {
        const company = this.companyForm.get('companyName')?.value;
        console.log(company)
         const payload: DropdownParamter = {
            returnType: 'MODULESTARTDATE',
            returnValue: data.value.toString(),
            username: this.authService.isLogIntType().userid.toString(),
            option1: company.companyid || '',
            option2: ''
        };
        this.setupService.onDropdownDetailsPublic(payload).subscribe({
            next: (res) => {
                const nextStartDate = res?.[0]?.next_start_date;
            this.moduleForm.patchValue({
                startDate: nextStartDate ? new Date(nextStartDate) : this.today
            });
            }
        });
    }

    submitDialog() {
        if (this.companyForm.invalid) {
            this.companyForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Fill company details before submitting.' });
            return;
        }

        if (!this.innerRows.length) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Add at least one module.' });
            return;
        }

        const { companyName, adminName, mobileNo, email } = this.companyForm.value;
        const loggedIn = this.authService.isLogIntType()?.userid.toString();

        const payload: CompanySubscriptionUpsertParamter = {
            p_companyid: companyName?.companyid ?? 0,
            p_companyname: companyName?.companyname ?? '',
            p_adminname: adminName,
            p_adminmobile: mobileNo,
            p_adminemail: email,
            p_subscription_json: this.innerRows.map((r) => ({
                moduleid: r.module,
                startdate: this.formatDate(r.startDate),
                enddate: this.formatDate(r.endDate)
            })),
            p_loginuser: loggedIn
        };

        this.companyService.upsertCompanySubscription(payload).subscribe({
            next: (res) => {
                this.visibleDialog = false;
               this.loadDropdown('SUBSCRIPTIONTENURE', '', 'filteredSubscriptions', (data) => {
            this.flattenedRows = [...data];
        });
                this.messageService.add({ severity: res.status, summary: 'Success', detail: res.data.msg });
            },
            error: (err) => {
                console.error('API error', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add subscription.' });
            }
        });
    }

    applyGlobalFilterManual() {
        const val = (this.globalFilter ?? '').toLowerCase().trim();

        if (!val) {
            this.flattenedRows = [...this.filteredSubscriptions];
            return;
        }

        this.flattenedRows = this.filteredSubscriptions.filter((r) => (r.company ?? '').toLowerCase().includes(val) || (r.email ?? '').toLowerCase().includes(val) || (r.mobile ?? '').includes(val) || (r.module ?? '').toLowerCase().includes(val));
    }
}
