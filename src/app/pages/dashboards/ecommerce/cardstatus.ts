import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnobModule } from 'primeng/knob';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DashboardService } from '@/core/services/dashboard.service';
import { AuthService } from '@/core/services/auth.service';
import { SkeletonModule } from 'primeng/skeleton';
import { CardParameter } from '@/core/models/dashboard.model';
import { filter } from 'rxjs';
import { DashboardsService } from '@/core/services/dashboardCard.service';

@Component({
    standalone: true,
    selector: 'app-card-status',
    imports: [CommonModule, KnobModule, FormsModule, RouterModule, SkeletonModule],
    template: `
       <div class="grid grid-cols-5 gap-4 mb-6">
           <!-- <ng-container *ngIf="usertype || projectname"> -->
        <div class="stat-card" *ngFor="let card of dashboardCards" (click)="onCardClick(card)">
          <div class="stat-icon" [ngClass]="card.iconBg">
            <i [class]="card.icon + ' text-xl'" [ngClass]="card.iconColor"></i>
          </div>
          <div class="stat-body">
            <span class="stat-label">{{ card.label }}</span>
            <span class="stat-value" [class.text-lg]="card.isLarge">{{ card.prefix }}{{ card.value | number }}</span>
            <!-- <span *ngIf="card.sub" class="stat-sub" [ngClass]="card.subColor">{{ card.sub }}</span> -->
            <span *ngIf="card.link" class="stat-sub text-blue-500 cursor-pointer hover:underline" (click)="card.onLinkClick && card.onLinkClick()">{{ card.link }}</span>
          </div>
        </div>
           <!-- </ng-container> -->

      </div>
    `,
    host: {
        '[style.display]': '"contents"'
    },
    styles:`
    .stat-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 1rem 1.1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  line-height: 1.3;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.stat-sub {
  font-size: 11px;
  font-weight: 500;
}
    `
})
export class CardStatus implements OnChanges, OnInit {
     @Input() filters: { project: any; groupLeader: any; period: any } = {
        project: null,
        groupLeader: null,
        period: null
    };
    
    public authService = inject(AuthService);
    usertype:string='';
    projectname:string='';
    companyId: string = '';
    loading = true;
    skeletonItems = [1, 2, 3, 4];
    dashboardCards: any = [];
    
    constructor(private dashboardService: DashboardsService, private router: Router) {}

ngOnInit() {
  this.usertype = this.authService.isLogIntType()?.usertype;
  this.projectname = this.authService.isLogIntType()?.projectname;
}

    ngOnChanges(changes: SimpleChanges): void {
       this.companyId = this.authService.isLogIntType()?.companyid.toString();
        if (changes['filters']) {
                this.OnGettopBarCard();
        }
    }

    onCardClick(card: any) {
      if (card.route) {
          this.router.navigate([card.route]);
      }
    }

    OnGettopBarCard() {
        this.loading = true;
        const mobileno = this.authService.isLogIntType()?.mobileno;
        const project = Number(this.filters.project ?? '');
        const period = String(this.filters.period ?? '');
        let payload: CardParameter = {
            companyId: this.companyId,
            mobileNo: mobileno,
            projectId: project,
            status: ''
        };
        this.dashboardService.onGetWorkerCards(payload).subscribe({
            next: (res) => {
                const data = res.data.summary;
                
                this.dashboardCards = [
                    {
                        label: 'Total Sites',
                        icon: 'pi pi-briefcase',
                        iconBg: 'bg-blue-100',
                        iconColor: 'text-blue-600',
                        value: data.total_projects,
                        sub: '+2 this month',
                        subColor: 'text-blue-500'
                    },
                    {
                        label: 'Total Labour Onboarded',
                        icon: 'pi pi-users',
                        iconBg: 'bg-teal-100',
                        iconColor: 'text-teal-600',
                        value: data.total_worker,
                        sub: '+85 this month',
                        subColor: 'text-teal-500'
                    },
                    {
                        label: 'Active Labour Today',
                        icon: 'pi pi-user',
                        iconBg: 'bg-orange-100',
                        iconColor: 'text-orange-500',
                        value: data.active_labour_today,
                        sub: '79.01% of total',
                        subColor: 'text-gray-400'
                    },
                    {
                        label: 'Pending Approvals',
                        icon: 'pi pi-check-circle',
                        iconBg: 'bg-violet-100',
                        iconColor: 'text-violet-600',
                        value: data.pending_approvals,
                        link: 'View all',
                        route: '/layout/approval/my-approval',
                    },
                    {
                        label: 'Total Fund Allocated',
                        icon: 'pi pi-indian-rupee',
                        iconBg: 'bg-cyan-100',
                        iconColor: 'text-cyan-600',
                        value: data.total_fund_allocated,
                        prefix: '₹ ',
                        isLarge: true,
                        // link: 'View details'
                    }
                ];
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }
}