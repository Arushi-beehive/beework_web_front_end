import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, NgModel, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { DropdownParamter, removeParamter, UpsertWorkerProfileExit, UserInsert, UserType } from '@/core/models/setup.model';
import { AuthService } from '@/core/services/auth.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { Textarea } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
    selector: 'app-user',
    standalone: true,
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss'],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DropdownModule, InputTextModule, TableModule, CheckboxModule, DialogModule, ConfirmDialogModule, GlobalFilterComponent, MultiSelectModule, Textarea, DatePickerModule],
    providers: [ConfirmationService]
})
export class UserComponent {
    @ViewChild('glDropdown') glDropdown!: NgModel;
    userForm!: FormGroup;
    visibleDialog = false;
    user: any[] = [];
    profileOptions: any[] = [];
    projectOptions: any[] = [];
    filteredUser: any[] = [];
    groupLeaderOptions: any[] = [];
    editMode = false;
    selectedUser: any = null;
    globalFilter: string = '';
    showGlobalSearch: boolean = true;
    showPassword = false;
    showExitDialog = false;
    today: Date = new Date();
    exitLinkedUser: boolean = false;
    glTouched: boolean = false;
    glSameError: boolean = false;
    companyId = '';
    userGroupMap = new Map<number, any[]>();

    exitForm = {
        ppeReturn: false,
        exitDate: null,
        remark: '',
        newGroupLeader: null
    };

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private setupService: SetupMaintainceService,
        private messageService: MessageService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.initForm();
        this.filteredUser = [...this.user];
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
         this.onGetUserList();
        this.loadDropdown('USERPROFILE', 'profileOptions');
        this.loadDropdown('ACTIVEPROJECT', 'projectOptions');
    }

    initForm() {
        this.userForm = this.fb.group(
            {
                p_profile: ['', [Validators.required, Validators.maxLength(100)]],
                p_name: ['', [Validators.required, Validators.maxLength(100)]],
                projectname: [[]],
                p_pwd: ['', [Validators.required, Validators.minLength(6), Validators.pattern('^[A-Za-z\\d@$!%*?&#]{4,}$')]],
                conPassword: ['', Validators.required],
                p_phone: ['', [Validators.required, Validators.pattern(/[6-9]\d{9}$/)]],
                p_email: ['', [Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/), Validators.maxLength(150)]],
                checked: [true],
                mobileaccess: [true]
            },
            { validators: this.passwordMatchValidator }
        );
    }

    /** 🧮 Allow only digits **/
    allowOnlyDigits(event: KeyboardEvent) {
        const char = event.key;
        if (!/[0-9]/.test(char)) {
            event.preventDefault();
        }
    }

    passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
        const password = group.get('p_pwd')?.value;
        const confirm = group.get('conPassword')?.value;
        return password === confirm ? null : { passwordMismatch: true };
    };

    loadDropdown(type: string, key: 'profileOptions' | 'projectOptions') {
        
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: '',
            username: '',
            option1: this.companyId,
            option2: ''
        };
         const $api = (type==='ACTIVEPROJECT') ? this.setupService.onDropdownDetailsPublic(payload) : this.setupService.onDropdownDetails(payload);
        $api.subscribe({
            next: (res) => {
               this[key] = type === 'ACTIVEPROJECT' ? res.data : res.data;         
            }
        });
    }

    /** ✳️ Add User Dialog **/
    openUserDialog() {
        this.visibleDialog = true;
        this.editMode = false;
        this.userForm.reset({
            checked: true,
            mobileaccess: true,
            projectname: []
        });
    }

    openEditDialog(user: any) {
        console.log('edit:', user);
        this.visibleDialog = true;
        this.editMode = true;
        this.selectedUser = user;
        const group = this.userGroupMap.get(user.userid) ?? [];
        const profile = this.profileOptions.find((p) => p.profilename === this.selectedUser.profile);
        // const project = this.projectOptions.find((p: any) => p.project_name === this.selectedUser.Project_Name);
        const projectIds = group
            .map((entry) => {
                const match = this.projectOptions.find((p: any) => p.project_name === entry.Project_Name);
                return match?.project_id ?? null;
            })
            .filter((id) => id !== null);

        console.log('Grouped project IDs for edit:', projectIds);

        this.userForm.patchValue({
            p_profile: profile?.profileid,
            p_name: user.username,
            projectname: projectIds,
            p_phone: user.mobileno,
            p_email: user.emailid,
            p_pwd: user.password,
            conPassword: user.password,
            checked: user.isactive === 'Yes'
        });
    }

    onGetUserList() {
       const payload: UserType = {
                   isActive: null,
                   companyId: this.companyId
               };
        this.setupService.onGetUser(payload).subscribe({
            next: (res) => {
                const rawData = Array.isArray(res?.data.data) ? res.data.data : [];
                this.userGroupMap = rawData.reduce((acc: any, user: any) => {
                    if (!acc.has(user.userid)) {
                        acc.set(user.userid, []);
                    }
                    acc.get(user.userid).push(user);
                    return acc;
                }, new Map<number, any[]>());
                this.filteredUser = [...this.user];
                this.user = Array.from(this.userGroupMap.values()).map((group) => group[0]);
                this.filteredUser = [...this.user];
            },
            error: (err) => {
                console.error(err);
            }
        });
    }

    get isSiteAdmin(): boolean {
        const selectedProfile = this.profileOptions.find((p) => p.profileid === this.userForm.get('p_profile')?.value);
        return selectedProfile?.profilename === 'Site Admin';
    }

    onProjectSelectionChange(selectedIds: any[]) {
        if (this.isSiteAdmin && selectedIds.length > 1) {
            this.userForm.get('projectname')?.setValue([selectedIds[selectedIds.length - 1]]);
        }
    }

    onUserCreation(data: any) {
        const selectedProfile = this.profileOptions.find((p: any) => p.profileid === data.p_profile);
        const userid = this.authService.isLogIntType().userid;
        const payload: any = {
            companyId: this.companyId,
            userId: this.editMode ? this.selectedUser.userid : 0,
            fname: data.p_name,
            lname: '',
            mobileNo: data.p_phone.toString(),
            password: data.p_pwd,
            emailId: data.p_email || '',
            userType: selectedProfile?.profilename,
            isActive: data.checked ? 'Y' : 'N',
            projectId: JSON.stringify(data.projectname),
            createdBy: userid,
            updatedBy: userid
        };
        this.setupService.onUserInsert(payload).subscribe({
            next: (res) => {
                let severity, summary;
                if (res.data.success) {
                    severity = 'success';
                    summary = 'Success';
                } else {
                    severity = 'error';
                    summary = 'failed';
                }
                this.showMessage(severity, summary, res.data.msg);
                const newUser = {
                    profile: selectedProfile?.profilename || '',
                    username: data.p_name,
                    mobileno: data.p_phone,
                    emailid: data.p_email,
                    isactive: data.checked ? 'Y' : 'N'
                };
                if (this.editMode) {
                    const index = this.user.findIndex((u: any) => u.userId === this.selectedUser.userId);
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
                    returnType: 'REMOVEUSER',
                    returnValue: data.userid,
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
                            this.showMessage(severity, summary, res.data.message);
                            const index = this.user.indexOf(data);
                            if (index !== -1) {
                                this.user.splice(index, 1);
                                this.filteredUser = [...this.user];
                            }
                        }
                    }
                });
            }
        });
    }

    openExitDialog(user: any) {
        this.selectedUser = user;
        this.exitForm = { ppeReturn: false, exitDate: null, remark: '', newGroupLeader: null };
        this.exitLinkedUser = false;
        this.glTouched = false;
        this.glSameError = false;
        this.showExitDialog = true;
        setTimeout(() => {
            this.glDropdown?.control?.markAsUntouched();
        });
        if (user.profile === 'Group Leader') {
            this.loadGroupLeaderDropdown(user.userid);
        }
    }

    loadGroupLeaderDropdown(excludeUserId?: number) {
        const payload: any = {};
        const ddType = 'GROUP LEADER';
        const ddValue = null;
        const companyId = this.companyId;
        this.setupService.onGetDropdownMaster(payload, ddType, ddValue, companyId).subscribe({
            next: (res) => {
                this.groupLeaderOptions = (res.data.data || []).filter((gl: any) => gl.userid !== excludeUserId);
            }
        });
    }

    onGroupLeaderChange() {
        this.glSameError = false;
        this.glTouched = false;
        if (this.exitForm.newGroupLeader === this.selectedUser?.userid) {
            this.glSameError = true;
        }
    }

    submitExit() {
        if (!this.exitForm.ppeReturn) {
            this.showMessage('warn', 'Warning', 'Please confirm PPE Kit is returned');
            return;
        }

        if (!this.exitForm.exitDate) {
            this.showMessage('warn', 'Warning', 'Please select Exit Date');
            return;
        }

        const username = this.authService.isLogIntType().userid;
        const exitDate = new Date(this.exitForm.exitDate).toISOString().split('T')[0];

        let api$;
        if (this.selectedUser.profile === 'Group Leader' && !this.exitLinkedUser) {
            if (!this.exitForm.newGroupLeader) {
                this.glTouched = true;
                this.showMessage('warn', 'Warning', 'Please select a Group Leader');
                return;
            }

            const selectedGL = this.groupLeaderOptions.find((gl: any) => gl.id === this.exitForm.newGroupLeader);

            if (selectedGL && selectedGL.dd_value === this.selectedUser.userid) {
                this.glSameError = true;
                this.showMessage('warn', 'Warning', 'New Group Leader cannot be the same as the exiting user');
                return;
            }

            const payload: UpsertWorkerProfileExit = {
                companyId: this.companyId,
                userId: this.selectedUser.userid,
                exitDate: exitDate,
                remark: this.exitForm.remark,
                createdBy: username.toString(),
                updatedBy: username.toString(),
                ppeReturn: this.exitForm.ppeReturn ? 'Y' : 'N',
                reactive: 'N',
                workerExit: this.exitLinkedUser ? 'Y' : 'N',
                newGroupLeader: this.exitLinkedUser ? 0 : this.exitForm.newGroupLeader
            };
            api$ = this.setupService.upsertWorkerProfileExit(payload);
        } else {
            const payload: UpsertWorkerProfileExit = {
                companyId: this.companyId,
                userId: this.selectedUser.userid,
                exitDate: exitDate,
                remark: this.exitForm.remark,
                createdBy: username.toString(),
                updatedBy: username.toString(),
                ppeReturn: this.exitForm.ppeReturn ? 'Y' : 'N',
                reactive: 'N',
                workerExit: 'Y',
                newGroupLeader: 0
            };
            api$ = this.setupService.upsertWorkerProfileExit(payload);
        }

        api$.subscribe({
            next: (res) => {
                if (res.data.success) {
                    this.showMessage('success', 'Success', res.data.msg);
                } else {
                    this.showMessage('error', 'Failed', res.data.msg);
                }
                this.onGetUserList();
                this.showExitDialog = false;
            }
        });
    }

    confirmActivate(user: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to activate this worker?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.selectedUser = user;
                const username = this.authService.isLogIntType().userid;
                const payload: UpsertWorkerProfileExit = {
                    companyId: this.companyId,
                    userId: this.selectedUser.userid,
                    exitDate: '',
                    remark: '',
                    createdBy: '',
                    updatedBy: username.toString(),
                    ppeReturn: '',
                    reactive: 'Y',
                    workerExit: 'Y',
                    newGroupLeader: 0
                };
                this.setupService.upsertWorkerProfileExit(payload).subscribe({
                    next: (res) => {
                        if (res.data.success) {
                            this.selectedUser.isactive = 'No';
                            this.showMessage('success', 'Success', res.data.msg);
                        } else {
                            this.showMessage('error', 'Failed', res.data.msg);
                        }
                        this.onGetUserList();
                        this.showExitDialog = false;
                        this.selectedUser = null;
                    }
                });
            }
        });
    }

    /** ✅ Submit Form **/
    onSubmit() {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            return;
        }
        this.onUserCreation(this.userForm.getRawValue());
    }

    /** 🔍 Global Filter **/
    applyGlobalFilterManual() {
        const value = this.globalFilter.toLowerCase();
        if (!value) {
            this.filteredUser = [...this.user];
            return;
        }
        this.filteredUser = this.user.filter((user) => Object.values(user).some((v) => String(v).toLowerCase().includes(value)));
    }

    /** 🔁 Reset Filter **/
    clearGlobalFilter(input: HTMLInputElement) {
        input.value = '';
        this.globalFilter = '';
    }

    showMessage(severity: string, summary: string, message: string) {
        this.messageService.add({ severity: severity, summary: summary, detail: message });
    }
}
