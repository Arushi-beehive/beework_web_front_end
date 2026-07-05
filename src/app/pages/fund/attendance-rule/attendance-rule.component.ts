import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { FundService } from '@/core/services/fund.service';
import { AuthService } from '@/core/services/auth.service';
import { AccessPermission, AccessUserProfile, DropdownParamter } from '@/core/models/setup.model';

@Component({
    selector: 'app-attendance-rule',
    imports: [CommonModule, FormsModule, DropdownModule, CheckboxModule, ButtonModule,
              MultiSelectModule, RadioButtonModule, DatePickerModule, ConfirmDialogModule, TooltipModule],
    templateUrl: './attendance-rule.component.html',
    styleUrl: './attendance-rule.component.scss',
    providers: [ConfirmationService]
})
export class AttendanceRuleComponent implements OnInit {

    constructor(
        private setupService: SetupMaintainceService,
        private confirmationService: ConfirmationService, 
        private messageService: MessageService,
        private authService: AuthService,
        private fundService: FundService
    ) {}

    projectOptions: AccessUserProfile[] = [];
    selectedProject: any = null;
    startDate: Date | null = null;
    maxDate: Date = new Date();
    availablePermissions: any[] = [];
    selectedItems: any[] = [];       // multiselect bound value
    selectedWise: string = 'Group';
    userid: string = '';

    ngOnInit() {
        this.userid = this.authService.isLogIntType()?.userid.toString();
        this.loadDropdown('PROJECTLIST', 'projectOptions', this.userid);
    }

    onWiseChanges() {
        this.availablePermissions = [];
        this.selectedItems = [];
        if (this.selectedWise === 'Group') {
            this.loadDropdown('ALLGROUPLEADER', 'groupLeaderList', this.selectedProject);
        } else {
            this.loadDropdown('PROJECTBASEDWORKER', 'workerList', this.selectedProject);
        }
    }

    onProjectChange() {
        this.availablePermissions = [];
        this.selectedItems = [];
        if (this.selectedWise === 'Group') {
            this.loadDropdown('ALLGROUPLEADER', 'groupLeaderList', this.selectedProject);
        } else {
            this.loadDropdown('PROJECTBASEDWORKER', 'workerList', this.selectedProject);
        }
    }

    loadDropdown(type: string, key: string, value: string) {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: this.userid
        };

        this.setupService.onDropdownDetails(payload).subscribe({
            next: (res) => {
                if (type === 'PROJECTLIST') {
                    this.projectOptions = res.data;
                } else {
                    // both group and worker go to availablePermissions
                    this.availablePermissions = res.data.map((p: any) => ({ ...p, selected: true }));
                }
            }
        });
    }

    // when multiselect changes, sync selected state in selectedItems
    onMultiSelectChange() {
        this.selectedItems = this.selectedItems.map(i => ({ ...i, selected: true }));
    }

    // when checkbox unchecked in the box, remove from selectedItems
    onItemUncheck(item: any) {
        if (!item.selected) {
            this.selectedItems = this.selectedItems.filter(i =>
                this.selectedWise === 'Group'
                    ? i.group_leader_id !== item.group_leader_id
                    : i.profileid !== item.profileid
            );
        }
    }

    onAttendancePermission() {
        const date  = this.startDate ? this.formatLocalDate(this.startDate) : null;
        const payload: any = {
            attendanceDate: date,
            createdBy: 1,
            groupLeaderId: this.selectedWise === 'Group' ? this.selectedItems.map(p => p.group_leader_id) : null,
            workerId: this.selectedWise === 'Worker' ? this.selectedItems.map(p => p.profileid) : null
        };

        this.fundService.onSubmitAttendance(payload).subscribe({
            next: (res) => {
                const success = res.data.status;
                this.showSuccess(
                    success ? 'success' : 'error',
                    success ? 'Success' : 'Failed',
                    res.data.message
                );
            }
        });
    }

    formatLocalDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

    submit() {
        this.confirmationService.confirm({
            header: 'Confirmation',
            message: 'Are you sure you want to assign this?',
            accept: () => this.onAttendancePermission()
        });
    }

    reset() {
        this.selectedProject = null;
        this.startDate = null;
        this.selectedItems = [];
        this.availablePermissions = [];
        this.selectedWise = 'Group';
    }

    showSuccess(severity: string, summary: string, message: string) {
        this.messageService.add({ severity, summary, detail: message });
    }
}