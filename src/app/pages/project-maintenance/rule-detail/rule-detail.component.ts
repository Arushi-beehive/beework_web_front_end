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
import { DropdownParamter, removeParamter } from '@/core/models/setup.model';
import { RuleDetails, RuleModel } from '@/core/models/project.model';
import { AuthService } from '@/core/services/auth.service';
import { ProjectMaintainceService } from '@/core/services/project-maintaince.service';

@Component({
    selector: 'app-rule-detail',
    standalone: true,
    templateUrl: './rule-detail.component.html',
    styleUrls: ['./rule-detail.component.scss'],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DropdownModule, InputTextModule, TableModule, CheckboxModule, DialogModule, ConfirmDialogModule, GlobalFilterComponent],
    providers: [ConfirmationService]
})
export class RuleDetailComponent {
    ruleForm!: FormGroup;
    visibleDialog = false;
    user: any[] = [];
    filteredUser: any[] = [];
    editMode = false;
    selectedUser: any = null;
    globalFilter: string = '';
    showGlobalSearch: boolean = true;
    levels: any[] = [];
    ruleOptions: RuleModel[] = [];
    usernameOptions: any[] = [];
    expandedIds: Set<number> = new Set();
    primaryRows: any[] = [];
    allGroupedRows: Map<number, any[]> = new Map();
    selectedUserRow: any = null;
    companyId = '';

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private setupService: SetupMaintainceService,
        private authService: AuthService,
        private messageService: MessageService,
        private projectService: ProjectMaintainceService
    ) {}

    ngOnInit() {
        this.initForm();
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.loadDropdown('RULENAME', 'ruleOptions', '');
        this.loadDropdown('USERPROFILE', 'usernameOptions', '');
        this.loadDropdown('APPROVALLEVEL', 'user', '');
        this.filteredUser = [...this.user];
    }

    initForm() {
        this.ruleForm = this.fb.group({
            p_rule: ['', [Validators.required]],
            checked: [true],
            p_checked: [false]
        });
    }

    loadDropdown(type: string, key: 'ruleOptions' | 'usernameOptions' | 'user' | 'selectedUser', value: string) {
        const loggedInUserName = this.authService.isLogIntType().usertype;
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: loggedInUserName,
           option1: this.companyId, 
            option2:''
        };

        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res) => {
                this[key] = res.data;
                if (type === 'APPROVALLEVEL') {
                    this.user = res.data;
                    this.buildDisplayRows();
                }
                if (type === 'GETAPPROVALLEVEL') {
                    this.selectedUser = res.data;
                    this.levels = this.selectedUser.length
                        ? this.selectedUser.map((l: any) => ({
                              level_no: l.level_no,
                              pusername: l.profile_id
                          }))
                        : [{ pusername: null }];
                }
            }
        });
    }

    onChangeActive(event: any) {
        const isChecked = this.ruleForm.controls['p_checked'].value;
        if (isChecked) {
            this.filteredUser = this.user.filter((item: any) => {
                const ischeck = item.is_active;
                return ischeck === 'Y';
            });
        } else {
            this.filteredUser = [...this.user];
        }
    }

    /** ✳️ Add User Dialog **/
    openUserDialog() {
        this.visibleDialog = true;
        this.editMode = false;
        this.levels=[];
        this.ruleForm.reset({
            checked: true
        });
    }

    openEditDialog(user: any) {
        this.selectedUserRow = user;
        this.loadDropdown('GETAPPROVALLEVEL', 'selectedUser', user.rule_creation_id);
        this.visibleDialog = true;
        this.editMode = true;
        const ruleObj = this.ruleOptions.find((r) => r.rule_id === user.rule_id);
        this.ruleForm.patchValue({
            p_rule: ruleObj?.rule_id ?? null,
            checked: user.is_active === 'Y'
        });
        this.ruleForm.updateValueAndValidity();
    }

    closeDialog() {
        this.visibleDialog = false;
    }

    onUserCreation(data: any) {
        const loggedInUserId = this.authService.isLogIntType().userid;
        const ruleCreationId = this.editMode ? this.selectedUserRow?.rule_creation_id : 0;
        const payload: RuleDetails = {
            companyId: this.companyId,
            ruleId: data.p_rule,
            ruleCreationId: ruleCreationId,
            created: loggedInUserId,
            levels: (this.levels || [])
                .filter((x: any) => x.level_no)
                .map((x: any) => ({
                    level_no: x.level_no,
                    profile_id: x.pusername
                }))
        };
      
        this.projectService.onGetRuleDetails(payload).subscribe({
            next: (res: any) => {
                const ruleObj = this.ruleOptions.find((r) => r.rule_id === data.p_rule);
                const firstLevel = this.levels?.[0];
                const profileObj = this.usernameOptions.find((u: any) => u.profileid === firstLevel?.pusername);
                const newRule = {
                    profilename: profileObj?.profilename ?? '',
                    rule_name: ruleObj?.rule_name,
                    is_active: data.checked ? 'Y' : 'N',
                    levels: [...this.levels]
                };
                if (this.editMode && this.selectedUserRow) {
                    const index = this.user.indexOf(this.selectedUserRow);
                    if (index !== -1) {
                        this.user[index] = {
                            ...this.user[index],
                            ...newRule
                        };
                    }
                } else {
                    this.user.push(newRule);
                }
                let severity, summary;
                        if (res.data.status) {
                            severity = 'success';
                            summary = 'Success';
                        } else {
                             severity = 'error';
                            summary = 'Failed';
                        }
                            this.showMessage(severity, summary, res.data.message);
                this.buildDisplayRows();
                this.visibleDialog = false;
                this.selectedUserRow = null;
                this.selectedUser = null;
            },
            error: (err) => {
                console.log('Error', err);
            }
        });
    }

    deleteRow(data: any) {
        this.confirmationService.confirm({
            header: 'Confirm',
            message: 'Are you sure you want to delete this profile?',
            accept: () => {
                const username = this.authService.isLogIntType().userid;
                const payload:removeParamter = {
                  returnType:'REMOVERULE',
                  returnValue:data.rule_creation_id,
                  username: username,
                  companyId: this.companyId
                };
                this.setupService.onDeleteData(payload).subscribe({
                    next:(res)=>{
                       let severity, summary;
                        if (res.data.status === 'FAILED') {
                            severity = 'error';
                            summary = 'failed';
                             this.showMessage(severity, summary, res.data.message);
                        } else {
                            severity = 'success';
                            summary = 'Success';
                             this.showMessage(severity, summary, res.data.message);
                             this.user = this.user.filter(
                            (row) => row.rule_creation_id !== data.rule_creation_id
                        );
                        }     
                        this.buildDisplayRows();
                    }
                });
            }
        });
    }

    /** ✅ Submit Form **/
    onSubmit() {
        if (this.ruleForm.invalid) {
            this.ruleForm.markAllAsTouched();
            return;
        }
        this.onUserCreation(this.ruleForm.getRawValue());
    }

    isSubmitDisabled(): boolean {
        if (!this.levels || this.levels.length === 0) return false;
        return this.levels.some((level: any) => !level.pusername);
    }

    /** 🔍 Global Filter **/
    applyGlobalFilter() {
        this.applyGlobalFilterManual();
    }
    applyGlobalFilterManual() {
        const value = this.globalFilter;
        if (!value) {
            this.filteredUser = [...this.user];
            return;
        }
        this.filteredUser = this.user.filter((user) => Object.values(user).some((v) => String(v).toLowerCase().includes(value)));
    }

    addRow() {
        const nextLevel = (this.levels?.length || 0) + 1;
        this.levels.push({
            level_no: nextLevel,
            pusername: null
        });
    }

    removeRow(index: number) {
        this.levels.splice(index, 1);
    }

    buildDisplayRows() {
        // Group all rows by rule_creation_id
        this.allGroupedRows = new Map();
        for (const row of this.user) {
            const id = row.rule_creation_id;
            if (!this.allGroupedRows.has(id)) {
                this.allGroupedRows.set(id, []);
            }
            this.allGroupedRows.get(id)!.push(row);
        }

        // Keep only first occurrence of each rule_creation_id for display
        const seen = new Set();
        this.filteredUser = this.user.filter((row) => {
            if (seen.has(row.rule_creation_id)) return false;
            seen.add(row.rule_creation_id);
            return true;
        });
    }

    getGroupCount(id: number): number {
        return this.allGroupedRows.get(id)?.length ?? 0;
    }

    isExpanded(id: number): boolean {
        return this.expandedIds.has(id);
    }

    toggleExpand(id: number) {
        if (this.expandedIds.has(id)) {
            this.expandedIds.delete(id);
        } else {
            this.expandedIds.add(id);
        }
    }

    getSubRows(id: number, primaryRow: any): any[] {
        const group = this.allGroupedRows.get(id) ?? [];
        return group.filter((r) => r !== primaryRow);
    }

     showMessage(severity: string, summary: string, message: string) {
        this.messageService.add({ severity: severity, summary: summary, detail: message });
    }
}
