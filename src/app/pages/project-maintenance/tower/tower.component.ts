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
import { ProjectMaintainceService } from '@/core/services/project-maintaince.service';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { DropdownParamter, removeParamter, UserType } from '@/core/models/setup.model';
import { MobileOption } from '@/core/models/project.model';
import { AuthService } from '@/core/services/auth.service';

@Component({
    selector: 'app-tower',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DropdownModule, InputTextModule, TableModule, CheckboxModule, DialogModule, ConfirmDialogModule, GlobalFilterComponent],
    templateUrl: './tower.component.html',
    styleUrl: './tower.component.scss',
    providers: [ConfirmationService]
})
export class TowerComponent {
    towerForm!: FormGroup;
    visibleDialog = false;
    editMode = false;
    selectedTower: any;
    globalFilter = '';
    projectOption: any[] = [];
    towers: any[] = [];
    towerInchargeOption: MobileOption[] = [];
    filteredTowers: any[] = [];
    companyId = '';

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private projectService: ProjectMaintainceService,
        private setupService: SetupMaintainceService,
        private messageService: MessageService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.initForm();
        this.filteredTowers = [...this.towers];
        this.onGetTowerList();
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.loadDropdown('TOWERINCHARGE', 'towerInchargeOption');
        this.loadDropdown('ACTIVEPROJECT', 'projectOption');
    }

    initForm() {
        this.towerForm = this.fb.group({
            projectName: ['', Validators.required],
            towerName: ['', Validators.required],
            location: [''],
            towerincharge: [''],
            projectIncharge: [''],
            checked: ['true']
        });
    }

    loadDropdown(type: string, key: 'towerInchargeOption' | 'projectOption') {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: '',
            username: '',
           option1: this.companyId, 
            option2:''
        };
        const $api = type==='ACTIVEPROJECT'? this.setupService.onDropdownDetailsPublic(payload) : this.setupService.onDropdownDetails(payload);
        $api.subscribe({
            next: (res) => {
              this[key] = type === 'ACTIVEPROJECT' ? res.data : res.message;
            }
        });
    }

    openTowerDialog() {
        this.editMode = false;
        this.visibleDialog = true;
        this.towerForm.reset({ checked: true });
        this.towerForm.get('location')?.disable();
        this.towerForm.get('projectIncharge')?.disable();
    }

    openEditDialog(row: any) {
        this.editMode = true;
        this.selectedTower = row;
        this.visibleDialog = true;
        this.towerForm.get('location')?.disable();
        this.towerForm.get('projectIncharge')?.disable();
        const payload: DropdownParamter = {
            returnType: 'TOWERINCHARGE',
            returnValue: '',
            username: '',
           option1: this.companyId, 
            option2:''
        };
        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res) => {
                this.towerInchargeOption = res.message;
                if (row.project_id) {
                    const alreadyInList = this.towerInchargeOption.some((x) => x.userid === row.tower_incharge_id);
                    if (!alreadyInList) {
                        this.towerInchargeOption = [
                            {
                                userid: row.tower_incharge_id,
                                fullname: row.tower_incharge_name,
                                mobileno: row.mobileno
                            },
                            ...this.towerInchargeOption
                        ];
                    }
                }
            }
        });
        const projectname = this.projectOption.find((p) => p.project_id === row.project_id);
        this.towerForm.patchValue({
            projectName: projectname.project_id,
            projectIncharge: row.project_incharge_name,
            location: row.location,
            towerincharge: row.tower_incharge_id,
            towerName: row.tower_name,
            checked: row.tower_is_active === 'Y'
        });
    }

    closeDialog() {
        this.visibleDialog = false;
        this.editMode = false;
        this.selectedTower = null;
        this.loadDropdown('TOWERINCHARGE', 'towerInchargeOption');
    }

    onGetTowerList() {
        const payload: UserType = {
            isActive: null,
            companyId: this.companyId
        };
        this.projectService.onGetTowerList(payload).subscribe({
            next: (res) => {
                this.towers = Array.isArray(res?.message.data) ? res.message.data : [];
                this.filteredTowers = [...this.towers];
            },
            error: (err) => {
                console.error(err);
            }
        });
    }

    onTowerCreation(data: any) {
        const payload: any = {
            actionType: this.editMode ? 'UPDATE' : 'INSERT',
            towerId: this.editMode ? this.selectedTower.tower_id : null,
            projectId: data.projectName,
            towerName: data.towerName,
            towerInchargeId: data.towerincharge,
            isActive: data.checked ? 'Y' : 'N',
            userId: 1
        };
    
        this.projectService.onGetTowerUpsert(payload).subscribe({
            next: (res: any) => {
                const newTower: any = {
                    tower_name: data.towerName,
                    project_name: data.projectName,
                    tower_incharge_id: data.towerincharge,
                    tower_is_active: data.checked ? 'Y' : 'N'
                };
                if (this.editMode && this.selectedTower) {
                    const index = this.towers.indexOf(this.selectedTower);
                    if (index !== -1) {
                        this.towers[index] = { ...this.towers[index], ...newTower };
                    }
                } else {
                    this.towers.push(newTower);
                }
                 let severity, summary;
                        if (res.data.success) {
                              severity = 'success';
                            summary = 'Success';
                        } else {
                            severity = 'error';
                            summary = 'failed';
                        }
                            this.showMessage(severity, summary, res.data.msg);
                this.filteredTowers = [...this.towers];
                this.visibleDialog = false;
                this.selectedTower = null;
                this.onGetTowerList();
            },
            error: (err) => {
                console.error(err);
            }
        });
    }

    onSubmit() {
        if (this.towerForm.invalid) {
            this.towerForm.markAllAsTouched();
            return;
        }
        this.onTowerCreation(this.towerForm.getRawValue());
    }

    deleteRow(data: any) {
        this.confirmationService.confirm({
            header: 'Confirm',
            message: 'Are you sure you want to delete this tower?',
            accept: () => {
                const username = this.authService.isLogIntType().userid;
                const payload: removeParamter = {
                    returnType: 'REMOVETOWER',
                    returnValue: data.tower_id,
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
                            const index = this.towers.indexOf(data);
                            this.towers.splice(index, 1);
                            this.filteredTowers = [...this.towers];
                        }
                    }
                });
            }
        });
    }

    applyGlobalFilter() {
        const value = this.globalFilter.toLowerCase();
        this.filteredTowers = this.towers.filter((t) => Object.values(t).some((v) => JSON.stringify(v).toLowerCase().includes(value)));
    }

    showMessage(severity: string, summary: string, message: string) {
        this.messageService.add({ severity: severity, summary: summary, detail: message });
    }
}
