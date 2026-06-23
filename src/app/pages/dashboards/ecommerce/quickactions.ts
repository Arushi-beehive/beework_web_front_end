import { Component, model, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PermissionService } from '@/core/services/permissionService.service';


@Component({
    standalone: true,
    selector: 'app-quick-actions',
    imports: [ChartModule, CommonModule],
    template: `
        <div class="card-panel mb-6">
            <h3 class="panel-title mb-3">Quick Actions</h3>
            <div class="flex flex-wrap gap-4">
                <div *ngFor="let action of visibleActions" class="quick-action-btn">
                    <div class="qa-icon" [ngClass]="action.bgClass" (click)="navigate(action.routes)">
                        <i [class]="action.icon + ' text-white text-lg'"></i>
                    </div>
                    <span class="text-xs text-gray-600 text-center leading-tight">{{ action.label }}</span>
                </div>
            </div>
        </div>
    `,
    styles: `
        .card-panel {
            background: #fff;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            padding: 1.1rem 1.25rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .panel-title {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.75rem;
        }
        .quick-action-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            width: 80px;
            transition: transform 0.15s;

            &:hover {
                transform: translateY(-2px);
            }
        }

        .qa-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `
})
export class QuickActions implements OnInit {
     // ── Quick Actions ───────────────────────────────────
    allActions = [
        { label: 'User', icon: 'pi pi-user-plus', bgClass: 'bg-teal-500', routes:'/layout/setup/user', permissionKey:'USER' },
        { label: 'Project Creation', icon: 'pi pi-folder', bgClass: 'bg-orange-400', routes:'/layout/project-maintenance/project', permissionKey:'PROJECT' },
        { label: 'My Approval', icon: 'pi pi-check-square', bgClass: 'bg-pink-500', routes:'/layout/approval/my-approval', permissionKey:'MY_APPROVAL' },
        { label: 'Daily Labour Report', icon: 'pi pi-calendar-clock', bgClass: 'bg-blue-500', routes:'/layout/reports/daily-labour', permissionKey:'DAILY_LABOUR_REPORT' },
        { label: 'Onboarding Reports', icon: 'pi pi-user-plus', bgClass: 'bg-indigo-500', routes:'/layout/reports/worker-onboarding', permissionKey:'WORKER_ONBOARDING' }
    ];

    visibleActions: typeof this.allActions = [];

    constructor(
        private router:Router,
        private permissionService: PermissionService
    ){}

    ngOnInit(){
    // this.visibleActions = this.allActions;
    this.permissionService.getAllowedPermissions().subscribe({
        next:(allowed)=>{
            this.visibleActions = this.allActions.filter(action => !action.permissionKey || allowed.includes(action.permissionKey) );
        },
        error:()=> {
            this.visibleActions=[];
        },
    });       
    }

    navigate(route:string){
        if(route){
            this.router.navigate([route]);
        }
    }
}
