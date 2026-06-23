import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { GlobalFilterComponent } from '@/shared/global-filter/global-filter.component';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { DropdownParamter, removeParamter, UserType, UserTypeInsert } from '@/core/models/setup.model';
import { AuthService } from '@/core/services/auth.service';

@Component({
    selector: 'app-user-type',
    standalone: true,
    templateUrl: './user-type.component.html',
    styleUrls: ['./user-type.component.scss'],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DropdownModule, InputTextModule, TableModule, CheckboxModule, DialogModule, ConfirmDialogModule, GlobalFilterComponent],
    providers: [ConfirmationService]
})
export class UserTypeComponent {
    profileForm!: FormGroup;
    visibleDialog = false;
    user: any[] = [];
    filteredUser: any[] = [];
    editMode = false;
    selectedUser: any = null;
    globalFilter: string = '';
    showGlobalSearch: boolean = true;
    companyId = '';

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private setupService: SetupMaintainceService,
        private messageService: MessageService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.initForm();
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.filteredUser = [...this.user];
        this.onGetUserList();
    }

    initForm() {
        this.profileForm = this.fb.group({
            p_pname: ['', [Validators.required, Validators.maxLength(100)]],
            checked: [true],
            webaccess:[true]
        });
    }

    /** ✳️ Add User Dialog **/
    openUserDialog() {
        this.visibleDialog = true;
        this.editMode = false;
        this.profileForm.reset({ checked: true, webaccess:true });
        
        this.profileForm.get('p_pname')?.enable();
        this.profileForm.get('checked')?.enable();
        this.profileForm.get('webaccess')?.enable();
    }

    openEditDialog(user: any) {
        this.editMode = true;
        this.selectedUser = user;
        this.profileForm.patchValue({
            p_pname: user.profilename,
            checked: user.isactive === 'Y',
            webaccess: user.web_access ==='Y'
        });
        this.visibleDialog = true;
    }

    closeDialog() {
        this.visibleDialog = false;
    }
    onGetUserList() {
        const payload: UserType = {
            isActive:'',
            companyId: this.companyId
        };
        this.setupService.onUserTypeList(payload).subscribe({
            next: (res) => {
                this.user = Array.isArray(res?.data.data) ? res.data.data : [];
                this.filteredUser = [...this.user];
            },
            error: (err) => {
                console.error(err);
            }
        });
    }
    onUserCreation(data: any) {
        const username = this.authService.isLogIntType()?.userid.toString();
        const payload: UserTypeInsert = {
            companyId: this.companyId,
            profileId: this.editMode ? this.selectedUser.profileid : 0,
            profileName: data.p_pname,
            isActive: data.checked ? 'Y' : 'N',
            webaccess: data.webaccess ? 'Y' : 'N',
            user: username
        };
        
        this.setupService.onUserTypeInsert(payload).subscribe({
            next: (res) => {
                const newUser = {
                    profilename: data.p_pname,
                    isactive: data.checked ? 'Y' : 'N',
                    web: data.webaccess? 'Y' : 'N'
                };
                
                if (this.editMode && this.selectedUser) {
                    const index = this.user.indexOf(this.selectedUser);
                    if (index !== -1) {
                        this.user[index] = {
                            ...this.user[index],
                            ...newUser
                        };
                    }
                } else {
                    this.user.push(newUser);
                }
                this.filteredUser = [...this.user];
                this.visibleDialog = false;
                this.selectedUser = null;
                this.onGetUserList();

                let severity, summary;
                if(res.data.success){
                    severity = 'success';
                    summary = 'Success';
                }
                else{
                    severity = 'error';
                    summary = 'failed';
                }
                this.showMessage(severity,summary, res.data.msg);
            },
            error: (err) => {
                console.error('API error', err);
            }
        });
    }

    deleteRow(data: any) {
        this.confirmationService.confirm({
            header: 'Confirm',
            message: 'Are you sure you want to delete this profile?',
            accept: () => {
                const username = this.authService.isLogIntType().userid;
                const payload: removeParamter = {
                    returnType: 'REMOVEUSERTYPE',
                    returnValue: data.profilename,
                    username: username,
                    companyId: this.companyId
                };
                this.setupService.onDeleteData(payload).subscribe({
                    next: (res) => {
                        let severity, summary;
                        if (res.data.status === 'FAILED') {
                            severity = 'error';
                            summary = 'failed';
                              this.showMessage(severity, summary, res.data.message);
                        } else {
                            severity = 'success';
                            summary = 'Success';
                            const index = this.user.indexOf(data);
                            if (index !== -1) {
                                this.user.splice(index, 1);
                                this.filteredUser = [...this.user];
                                  this.showMessage(severity, summary, res.data.message);
                            }
                        }
                    }
                });
            }
        });
    }

    onSubmit() {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }
        this.onUserCreation(this.profileForm.getRawValue());
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
