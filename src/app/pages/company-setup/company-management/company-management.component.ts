import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { DropdownParamter, removeParamter } from '@/core/models/setup.model';
import { AuthService } from '@/core/services/auth.service';
import { ProfileService } from '@/core/services/profile.service';

export function gstNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    return gstRegex.test(control.value.toUpperCase()) ? null : { invalidGst: true };
}

@Component({
    selector: 'app-company-management',
    standalone: true,
    templateUrl: './company-management.component.html',
    styleUrls: ['./company-management.component.scss'],
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule,
        ButtonModule, DropdownModule, InputTextModule,
        TableModule, CheckboxModule, DialogModule,
        FileUploadModule, ConfirmDialogModule, GlobalFilterComponent
    ],
    providers: [ConfirmationService]
})
export class CompanyManagementComponent {
    @ViewChild('fileUpload') fileUpload: any;

    companyForm!: FormGroup;
    visibleDialog = false;
    user: any[] = [];
    filteredUser: any[] = [];
    editMode = false;
    selectedUser: any = null;
    globalFilter: string = '';
    showGlobalSearch: boolean = true;
    companyId = '';

    // Logo
    selectedFile: File | null = null;
    logoBase64: string | null = null;
    imageUrl: string | null = '';

    // Dropdown data
    countries: any[] = [];
    states: any[] = [];
    cities: any[] = [];

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private setupService: SetupMaintainceService,
        private messageService: MessageService,
        private authService: AuthService,
        private profileService: ProfileService
    ) {}

    ngOnInit() {
        this.initForm();
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.filteredUser = [...this.user];
        this.onGetUserList();
    }

    initForm() {
        this.companyForm = this.fb.group({
            companyname:          ['', [Validators.required, Validators.maxLength(100)]],
            companyemail:         ['', [Validators.required, Validators.email,Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(100)]],
            companygstno:         ['', [Validators.required, gstNumberValidator]],
            companycontactperson: ['', Validators.maxLength(100)],
            companyaddress:       ['', [Validators.required, Validators.maxLength(500)]],
            companycontactphone:  ['', Validators.pattern(/[6-9]\d{9}$/)],
            companycontactemail:  ['', [Validators.email,Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(100)]],
            companycountry:       ['', Validators.required],
            companystate:         ['', Validators.required],
            companycity:          ['', Validators.required],
            companyphone:         ['', [Validators.required, Validators.pattern(/[6-9]\d{9}$/)]],
            companypincode:       ['', [Validators.required, Validators.maxLength(6)]],
            p_warehouse:          ['', [Validators.required, Validators.maxLength(100)]],
            statecode:            ['', [Validators.required, Validators.maxLength(5)]],
            bankname:             ['', [Validators.required, Validators.maxLength(100)]],
            accountno:            ['', [Validators.required, Validators.maxLength(25)]],
            pan:                  ['', [Validators.required, Validators.maxLength(25)]],
            ifsc:                 ['', [Validators.required, Validators.maxLength(25)]],
            branch:               ['', [Validators.required, Validators.maxLength(100)]]
        });
    }

    get cf() { return this.companyForm.controls; }

    allowOnlyDigits(event: KeyboardEvent) {
        if (!/[0-9]/.test(event.key)) {
            event.preventDefault();
        }
    }

    // ── Dropdown loading ─────────────────────────────────────
    loadDropdown(type: string, value: string, key: 'countries' | 'states' | 'cities', callback?: () => void) {
        const userId = this.authService.isLogIntType()?.userid;
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: userId,
            option1: this.companyId,
            option2: ''
        };
        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res) => {
                (this as any)[key] = res.data;
                callback?.();
            }
        });
    }

    onCountryChange(event: any) {
        this.companyForm.patchValue({ companystate: '', companycity: '' });
        this.states = [];
        this.cities = [];
        if (event.value) {
            this.loadDropdown('STATE', event.value, 'states');
        }
    }

    onStateChange(event: any) {
        this.companyForm.patchValue({ companycity: '' });
        this.cities = [];
        if (event.value) {
            this.loadDropdown('CITY', event.value, 'cities');
            const state = this.states.find(s => s.state_id === event.value);
            this.companyForm.patchValue({ statecode: state?.state_code ?? '' });
        }
    }

    // ── Dialog ────────────────────────────────────────────────
    openUserDialog() {
        this.visibleDialog = true;
        this.editMode = false;
        this.companyForm.reset();
        this.imageUrl = '';
        this.logoBase64 = null;
        this.selectedFile = null;
        this.loadDropdown('COUNTRY', 'null', 'countries');
    }

    openEditDialog(user: any) {
        this.editMode = true;
        this.selectedUser = user;
        this.visibleDialog = true;

        this.loadDropdown('COUNTRY', 'null', 'countries', () => {
            const country = this.countries.find(c => c.country_id === user.companycountry);
            const countryId = country ? country.country_id : user.companycountry;

            this.companyForm.patchValue({
                companyname:          user.companyname,
                companyemail:         user.companyemail,
                companygstno:         user.companygstno,
                companycontactperson: user.companycontactperson,
                companyaddress:       user.companyaddress,
                companycontactphone:  user.companycontactphone,
                companycontactemail:  user.companycontactemail,
                companycountry:       countryId,
                companyphone:         user.companyphone,
                companypincode:       user.companypincode,
                p_warehouse:          user.warehouse,
                bankname:             user.bankname,
                ifsc:                 user.ifsc,
                branch:               user.branch,
                pan:                  user.pan,
                accountno:            user.accountno
            });

            this.imageUrl = this.base64ToBlobUrl(user.companylogo);

            if (countryId) {
                this.loadDropdown('STATE', countryId, 'states', () => {
                    this.companyForm.patchValue({
                        companystate: user.companystate,
                        statecode: user.statecode
                    });
                    this.loadDropdown('CITY', user.companystate, 'cities', () => {
                        this.companyForm.patchValue({ companycity: user.companycity });
                    });
                });
            }
        });
    }

    closeDialog() {
        this.visibleDialog = false;
    }

    // ── Logo upload ───────────────────────────────────────────
    onFileSelect(event: any) {
        const file: File = event.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.messageService.add({ severity: 'warn', summary: 'Invalid File', detail: 'Please upload an image file' });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            this.messageService.add({ severity: 'warn', summary: 'Large File', detail: 'Image is large and will be compressed automatically' });
        }

        this.selectedFile = file;
        this.convertToBase64(file);
    }

    onFileClear() {
        this.selectedFile = null;
        this.logoBase64 = null;
    }

    convertToBase64(file: File) {
        const maxWidth = 300;
        const maxHeight = 200;
        const quality = 0.7;

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);

            this.logoBase64 = canvas.toDataURL('image/jpeg', quality);
            this.imageUrl = this.base64ToBlobUrl(this.logoBase64);
        };

        img.onerror = () => console.error('Image load error');
        img.src = objectUrl;
    }

    base64ToBlobUrl(base64: string | null | undefined): string | null {
        if (!base64 || !base64.includes(',')) return null;
        const [meta, data] = base64.split(',');
        const mime = meta.match(/:(.*?);/)![1];
        const byteString = atob(data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: mime });
        return URL.createObjectURL(blob);
    }

    // ── API calls ─────────────────────────────────────────────
    onGetUserList() {
        // const payload = { isActive: '', companyId: this.companyId };
        // this.setupService.onUserTypeList(payload).subscribe({
        //   next: (res) => {
        //     this.user = Array.isArray(res?.data.data) ? res.data.data : [];
        //     this.filteredUser = [...this.user];
        //   },
        //   error: (err) => console.error(err)
        // });
    }

    onUserCreation(data: any) {
        const username = this.authService.isLogIntType()?.userid.toString();
        const payload: any = {
            companyId:             this.editMode ? this.selectedUser.companyid : 0,
            p_companyname:         data.companyname,
            p_companyaddress:      data.companyaddress,
            p_companycity:         data.companycity,
            p_companystate:        data.companystate,
            p_companycountry:      data.companycountry,
            p_companypincode:      data.companypincode,
            p_companyphone:        data.companyphone,
            p_companyemail:        data.companyemail,
            p_companygstno:        data.companygstno,
            p_companycontactperson: data.companycontactperson,
            p_companycontactphone: data.companycontactphone,
            p_companycontactemail: data.companycontactemail,
            p_statecode:           data.statecode,
            p_bankname:            data.bankname,
            p_branch:              data.branch,
            p_ifsc:                data.ifsc,
            p_accountno:           data.accountno,
            p_pan:                 data.pan,
            p_warehouse:           data.p_warehouse,
            p_companyLogo:         this.logoBase64 || null,
            p_loginuser:           username
        };

        this.setupService.onUserTypeInsert(payload).subscribe({
            next: (res) => {
                this.visibleDialog = false;
                this.selectedUser = null;
                this.onGetUserList();
                const severity = res.data.success ? 'success' : 'error';
                const summary = res.data.success ? 'Success' : 'Failed';
                this.showMessage(severity, summary, res.data.msg);
            },
            error: (err) => console.error('API error', err)
        });
    }

    deleteRow(data: any) {
        this.confirmationService.confirm({
            header: 'Confirm',
            message: 'Are you sure you want to delete this company?',
            accept: () => {
                const username = this.authService.isLogIntType().userid;
                const payload: removeParamter = {
                    returnType: 'REMOVECOMPANY',
                    returnValue: data.companyname,
                    username: username,
                    companyId: this.companyId
                };
                this.setupService.onDeleteData(payload).subscribe({
                    next: (res) => {
                        if (res.data.status === 'FAILED') {
                            this.showMessage('error', 'failed', res.data.message);
                        } else {
                            const index = this.user.indexOf(data);
                            if (index !== -1) {
                                this.user.splice(index, 1);
                                this.filteredUser = [...this.user];
                                this.showMessage('success', 'Success', res.data.message);
                            }
                        }
                    }
                });
            }
        });
    }

    onSubmit() {
        if (this.companyForm.invalid) {
            this.companyForm.markAllAsTouched();
            return;
        }
        this.onUserCreation(this.companyForm.getRawValue());
    }

    applyGlobalFilterManual() {
        const value = this.globalFilter?.toLowerCase().trim();
        if (!value) {
            this.filteredUser = [...this.user];
            return;
        }
        this.filteredUser = this.user.filter((user) => Object.values(user).some((v) => String(v).toLowerCase().includes(value)));
    }

    clearGlobalFilter(input: HTMLInputElement) {
        input.value = '';
        this.globalFilter = '';
    }

    showMessage(severity: string, summary: string, message: string) {
        this.messageService.add({ severity: severity, summary: summary, detail: message });
    }
}