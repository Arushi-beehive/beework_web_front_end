import { Component, OnInit } from '@angular/core';
import { CardStatus } from './ecommerce/cardstatus';
import { RecentWorkerWidget } from './ecommerce/recentworkerwidget';
import { WorkerGraphReport } from './ecommerce/workergraphreport';
import { QuickActions } from './ecommerce/quickactions';
import { TopProductsWidget } from './ecommerce/topproductswidget';
import { FilterPage } from './ecommerce/filterpage';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService } from '@/core/services/auth.service';
import { SaleMangerDashboard } from './salemanagerdashboard';
import { ButtonModule } from 'primeng/button';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { DropdownParamter } from '@/core/models/setup.model';
import { on } from '@ngrx/store';

@Component({
    selector: 'app-ecommerce-dashboard',
    standalone: true,
    imports: [
        RecentWorkerWidget,
        // SaleMangerDashboard,
        // FilterPage,
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        DropdownModule,
        TagModule,
        PaginatorModule,
        IconFieldModule,
        InputIconModule,
        ButtonModule,
        CardStatus,
        WorkerGraphReport,
        QuickActions
    ],
    template: `
        <div class="dashboard-root">
            <!-- ═══════════════════════════ TOP BAR ═══════════════════════════ -->
            <div class="flex items-center justify-between mb-3">
                <div class="flex gap-3">
                    <p-dropdown [options]="projectNameOptions" [(ngModel)]="selectedProject" optionLabel="project_name" optionValue="project_id" placeholder="Project" (onChange)="onProjectChange()" styleClass="w-60 mb-4" [filter]="true" [showClear]="true" filterPlaceholder="Search Project" ></p-dropdown>
                    <p-dropdown [options]="periodOptions" [(ngModel)]="selectedPeriod" optionLabel="period_name" optionValue="period_name" placeholder="Period" (onChange)="onFilterChange()" styleClass="w-60 mb-4" [filter]="true" [showClear]="true"></p-dropdown>
                    <p-dropdown [options]="groupLeaderOptions" [(ngModel)]="selectedGroupLeader" optionLabel="dd_value" optionValue="dd_value" placeholder="Group Leader" (onChange)="onFilterChange()" styleClass="w-80 mb-4" [filter]="true" [showClear]="true" filterPlaceholder="Search Group Leader"></p-dropdown>
                </div>
            </div>

            <!-- ═══════════════════════════ QUICK ACTIONS ═══════════════════════════ -->
            <app-quick-actions />

            <!-- <app-filter-page /> -->
            <!-- ═══════════════════════════ STAT CARDS ═══════════════════════════ -->
            <app-card-status [filters]="activeFilters" />

            <!-- ═══════════════════════════ CHARTS ROW ═══════════════════════════ -->
            <app-worker-graph-report [filters]="activeFilters" />

            <!-- ═══════════════════════════ BOTTOM ROW ═══════════════════════════ -->
            <app-recent-worker-widget [filters]="activeFilters" />
        </div>
    `,
    styles: `
        .dashboard-root {
            padding: 1.5rem;
            background: #f1f5f9;
            min-height: 100vh;
            font-family: 'DM Sans', sans-serif;
        }
    `
})
export class EcommerceDashboard implements OnInit {
    constructor(
        private setupService: SetupMaintainceService,
        private authService: AuthService
    ) {}
    projectNameOptions: any[] = [];
    groupLeaderOptions: any[] = [];
    companyId = '';
    private isFilterUpdating = false; 
    periodOptions = [];
    selectedPeriod: number = new Date().getMonth() + 1; // default current month
    selectedProject: any = null;
    selectedGroupLeader: any = null;
    activeFilters = { project: null, groupLeader: null, period: null as any };


    ngOnInit(): void {      
        this.activeFilters = {
       project: null,
        groupLeader: null,
        period: new Date().getMonth()+1
    };
    this.companyId = this.authService.isLogIntType()?.companyid.toString();
      this.loadDropdown('ACTIVEPROJECT', 'projectNameOptions','');
      this.loadDropdown('PERIOD','periodOptions','')
       this.loadDropdownMaster();
    }

    loadDropdown(type: string, key: 'projectNameOptions'|'groupLeaderOptions' | 'periodOptions' ,value:string) {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: '',
           option1: this.companyId, 
            option2:''
        };

const $api = type==='ACTIVEPROJECT' || 'PERIOD' ? this.setupService.onDropdownDetailsPublic(payload) : this.setupService.onDropdownDetails(payload);

        $api.subscribe({
            next: (res) => {
                this[key] = res.data;
                 if (key === 'groupLeaderOptions' && this.isFilterUpdating) {
                this.isFilterUpdating = false;  
                this.onFilterChange();     
            }
            }
        });
    }

    loadDropdownMaster() {
        const payload: any = {};
        const ddType = 'GROUP LEADER';
         const ddValue = null;
        const companyId = this.companyId;
        this.setupService.onGetDropdownMaster(payload, ddType, ddValue, companyId).subscribe({
            next: (res: any) => {
                this.groupLeaderOptions = res.data.data;
                if (this.isFilterUpdating) {
                this.isFilterUpdating = false;  
                this.onFilterChange();        
            }
            }
        });
    }

    onProjectChange() {
        this.selectedGroupLeader = null;
        this.isFilterUpdating = true;
    if (this.selectedProject) {
        this.loadDropdown('ACTIVEGROUPLEADER', 'groupLeaderOptions', this.selectedProject);
    } else {
        this.loadDropdownMaster();
    }

   
}
onFilterChange(){
 this.activeFilters = {
        project: this.selectedProject,
        groupLeader: this.selectedGroupLeader,
        period: this.selectedPeriod
    };
}
}
