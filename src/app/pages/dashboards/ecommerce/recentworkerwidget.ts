import { Component, inject, Input, SimpleChanges, ViewChild } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { DropdownParamter } from '@/core/models/setup.model';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { AuthService } from '@/core/services/auth.service';
import { RecordReportService } from '@/core/services/reportService';
import { DashboardsService } from '@/core/services/dashboardCard.service';
import { ChartModule } from 'primeng/chart';
@Component({
    standalone: true,
    selector: 'app-recent-worker-widget',
    imports: [CommonModule, TableModule, ButtonModule, RippleModule, IconFieldModule, InputIconModule, InputTextModule, FormsModule, CardModule, TooltipModule, TagModule, SelectModule, ChartModule],
    template: `
        <div class="grid grid-cols-3 gap-4 mb-6">

<!-- Labour Onboarded Bar Chart -->
            <div class="card-panel col-span-2">
                <h3 class="panel-title">Labour Onboarded (Project wise)</h3>
                <p-chart type="bar" [data]="labourChartData" [options]="labourChartOptions" height="400px"></p-chart>
                <a class="view-link">View full report</a>
            </div>

 <!-- My Approval -->
            <div class="card-panel">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="panel-title mb-0">My Approval <span class="text-blue-500 font-medium">(12 Pending)</span></h3>
                    <a class="view-link mb-0">View all</a>
                </div>
                <p-table [value]="approvals || []" styleClass="approval-table" [scrollable]="false">
                    <ng-template pTemplate="header">
                        <tr>
                            <th class="table-th">Request Type</th>
                            <th class="table-th">Details</th>
                            <th class="table-th">Requested By</th>
                            <th class="table-th">Date</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-row>
                        <tr class="table-row">
                            <td class="table-td text-xs">{{ row.type }}</td>
                            <td class="table-td text-xs">{{ row.details }}</td>
                            <td class="table-td text-xs">{{ row.by }}</td>
                            <td class="table-td text-xs">
                                {{ row.date }}
                                <span class="priority-badge" [ngClass]="row.priorityClass">{{ row.priority }}</span>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
                <a class="view-link mt-3 block">Go to My Approval</a>
            </div>
</div>
 <div class="grid grid-cols-3 gap-4 mb-6">
 <!-- Fund Allocation -->
            <div class="card-panel">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="panel-title mb-0">Fund Allocation to Group Leaders</h3>
                    <a class="view-link mb-0">View all</a>
                </div>
                <p-table [value]="fundAllocations || []" styleClass="approval-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th class="table-th">Group Leader</th>
                            <th class="table-th text-right">Allocated (₹)</th>
                            <th class="table-th text-right">Utilized (₹)</th>
                            <th class="table-th text-right">Balance (₹)</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-row>
                        <tr class="table-row">
                            <td class="table-td text-xs">{{ row.leader }}</td>
                            <td class="table-td text-xs text-right">{{ row.allocated }}</td>
                            <td class="table-td text-xs text-right">{{ row.utilized }}</td>
                            <td class="table-td text-xs text-right font-medium text-blue-600">{{ row.balance }}</td>
                        </tr>
                    </ng-template>
                </p-table>
                <a class="view-link mt-3 block">Manage Fund Allocation</a>
            </div>

               <!-- Payment Distribution Donut -->
            <div class="card-panel flex flex-col items-center">
                <h3 class="panel-title w-full">Payment Distribution Summary</h3>
                <div class="relative flex items-center justify-center" style="width:180px;height:180px">
                    <p-chart type="doughnut" [data]="paymentChartData" [options]="paymentChartOptions" width="180px" height="180px"></p-chart>
                    <div class="absolute flex flex-col items-center pointer-events-none">
                        <span class="text-base font-bold text-gray-800">₹ 28.75L</span>
                        <span class="text-xs text-gray-500">Total Disbursed</span>
                    </div>
                </div>
                <div class="w-full mt-3 space-y-1">
                    <div class="legend-row"><span class="dot" style="background:#3b82f6"></span><span class="legend-label">Monthly Payment</span><span class="legend-val">₹12,45,000 (43.30%)</span></div>
                    <div class="legend-row"><span class="dot" style="background:#f59e0b"></span><span class="legend-label">Kharchi</span><span class="legend-val">₹7,80,000 (27.13%)</span></div>
                    <div class="legend-row"><span class="dot" style="background:#10b981"></span><span class="legend-label">Advance Payment</span><span class="legend-val">₹6,25,000 (21.74%)</span></div>
                    <div class="legend-row"><span class="dot" style="background:#8b5cf6"></span><span class="legend-label">Mobilization Advance</span><span class="legend-val">₹2,25,000 (7.83%)</span></div>
                </div>
                <a class="view-link mt-2">View payments</a>
            </div>

              <!-- Recent Activity -->
            <div class="card-panel">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="panel-title mb-0">Recent Activity</h3>
                    <!-- ✅ Refresh button -->
                    <button class="refresh-btn" (click)="refreshActivity()" [class.spinning]="isRefreshing" title="Refresh">
                        <i class="pi pi-refresh text-sm"></i>
                    </button>
                </div>
                <div class="space-y-3">
                    <div *ngFor="let act of recentActivity" class="activity-row">
                        <span class="activity-dot" [ngStyle]="{ background: act.activity_color }"></span>
                        <div class="flex-1">
                            <p class="text-xs text-gray-700 leading-snug">{{ act.activity_message }}</p>
                        </div>
                        <span class="text-xs text-gray-400 whitespace-nowrap ml-2">{{ act.activity_time }}</span>
                    </div>

                    <!-- ✅ Empty state -->
                    <div *ngIf="(recentActivity?.length ?? 0) === 0 && !isRefreshing" class="text-xs text-gray-400 text-center py-4">No recent activity</div>

                    <!-- ✅ Loading state -->
                    <div *ngIf="isRefreshing" class="text-xs text-gray-400 text-center py-4">Loading...</div>
                </div>
                <a class="view-link mt-3 block">View all activity</a>
            </div>

             <!-- Attendance Bification -->
            <div class="card-panel">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="panel-title mb-0">Attendance Bifurcation</h3>
                    <a class="view-link mb-0" (click)="downloadExcel('attendanceBifurcation')">Download</a>
                </div>
                <p-table [value]="attendanceBifurcation || []" styleClass="approval-table" [scrollable]="true" scrollHeight="300px">
                    <ng-template pTemplate="header">
                        <tr>
                            <th class="table-th" *ngFor="let col of attendanceBifurcationColumns">{{ col.header }}</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-row>
                        <tr class="table-row">
                            <td class="table-td text-xs" *ngFor="let col of attendanceBifurcationColumns">{{ row[col.field] }}</td>
                        </tr>
                    </ng-template>
                </p-table>
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

        .view-link {
            font-size: 12px;
            color: #2563eb;
            cursor: pointer;
            font-weight: 500;

            &:hover {
                text-decoration: underline;
            }
        }

        // ── Activity ───────────────────────────────────────────
        .activity-row {
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }

        .activity-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
            margin-top: 4px;
        }

        // ── Priority Badges ────────────────────────────────────
        .priority-badge {
            display: inline-block;
            font-size: 10px;
            font-weight: 600;
            padding: 1px 6px;
            border-radius: 4px;
            margin-left: 4px;

            &.badge-high {
                background: #fee2e2;
                color: #dc2626;
            }
            &.badge-medium {
                background: #fef3c7;
                color: #d97706;
            }
            &.badge-low {
                background: #dcfce7;
                color: #16a34a;
            }
        }

        .refresh-btn {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #6b7280;
            transition: all 0.2s;

            &:hover {
                background: #f1f5f9;
                color: #2563eb;
                border-color: #2563eb;
            }
        }

        // ✅ Spin animation on refresh
        @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        .spinning i {
            animation: spin 0.8s linear infinite;
        }
    `
})
export class RecentWorkerWidget {
    @Input() filters: { project: any; groupLeader: any; period: any } = {
        project: null,
        groupLeader: null,
        period: null
    };

 // ── Labour Bar Chart ────────────────────────────────
    labourChartData: any;
    labourChartOptions: any;
    labourOnboarding: any[] = [];
    labourOnboardingColumn: any[] = [];
    companyId= '';

    // ── Fund Allocation Table ───────────────────────────
    fundAllocations = [
        { leader: 'Group Leader A', allocated: '6,00,000', utilized: '4,25,000', balance: '1,75,000' },
        { leader: 'Group Leader B', allocated: '5,50,000', utilized: '3,80,000', balance: '1,70,000' },
        { leader: 'Group Leader C', allocated: '4,75,000', utilized: '3,60,000', balance: '1,15,000' },
        { leader: 'Group Leader D', allocated: '4,00,000', utilized: '2,95,000', balance: '1,05,000' },
        { leader: 'Group Leader E', allocated: '3,50,000', utilized: '2,10,000', balance: '1,40,000' }
    ];

    // ── Recent Activity ─────────────────────────────────
    recentActivity: any[] = [];
    isRefreshing = false;

    // ── Approvals Table ─────────────────────────────────
    approvals = [
        { type: 'Advance Payment', details: 'Advance for 15 workers', by: 'Group Leader A', date: '28 May 2025', priority: 'High', priorityClass: 'badge-high' },
        { type: 'Kharchi Distribution', details: 'Kharchi for 32 workers', by: 'Group Leader B', date: '28 May 2025', priority: 'Medium', priorityClass: 'badge-medium' },
        { type: 'Mobilization Kharchi', details: 'Mobilization for Project B', by: 'Site Admin', date: '27 May 2025', priority: 'High', priorityClass: 'badge-high' },
        { type: 'Attendance Regulation', details: 'Regularization request', by: 'Supervisor C', date: '27 May 2025', priority: 'Low', priorityClass: 'badge-low' },
        { type: 'Advance Payment', details: 'Advance for 10 workers', by: 'Group Leader D', date: '27 May 2025', priority: 'Medium', priorityClass: 'badge-medium' }
    ];

     // ── Payment Donut ───────────────────────────────────
    paymentChartData: any;
    paymentChartOptions: any;


    attendanceBifurcation: any[] = [];
    attendanceBifurcationColumns: any[] = [];

    constructor(
        private setupService: SetupMaintainceService,
        private authService: AuthService,
        private dashboardService: DashboardsService
    ) {}

    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
           this.initLabourChart();
           this.initPaymentChart();
        this.applyFilters();
    }

    loadDropdown(type: string, value: string, key:  'labourOnboarding' |'recentActivity' | 'attendanceBifurcation') {
        let username;
        if(key==='labourOnboarding'){
             username = ''; 
        }
        else{
          username = this.authService.isLogIntType().userid;
        }
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: username,
           option1: this.companyId, 
            option2:''
        };
        this.dashboardService.onGetReportDetails(payload).subscribe({
            next: (res) => {
                this[key] = res.message.data ?? [];
                if (key === 'attendanceBifurcation') this.attendanceBifurcationColumns = res.message.columns;
                if (key === 'recentActivity') {
                    this.recentActivity = res.message.data ?? [];
                    this.isRefreshing = false;
                }

                 if (key === 'labourOnboarding') {
                    this.labourOnboardingColumn = res.message.columns;
                      this.buildOnboardingChart(res.message.columns, res.message.data);
                }
               
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['filters'] ) {
            this.applyFilters();
        }
    }

    applyFilters() {
        const value = String(this.filters.project ?? '0');
        this.loadDropdown('REPORTACTIVITYLOG', value, 'recentActivity');
        this.loadDropdown('REPORTATTENDANCESUMMARY', value, 'attendanceBifurcation');
        this.loadDropdown('REPORTLABOURONBOARDED', '', 'labourOnboarding');
    }

    refreshActivity() {
        if (this.isRefreshing) return;
        this.isRefreshing = true;
        const value = String(this.filters.project ?? '0');
        this.loadDropdown('REPORTACTIVITYLOG', value, 'recentActivity');
    }

     buildOnboardingChart(columns: any[], data: any[]) {
        const labels = data.map((r) => r.project_name);
        const metricColumns = columns.filter((col) => col.field !== 'project_name');
        const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4'];
        this.labourChartData = {
            labels,
            datasets: metricColumns.map((col, i) => ({
                label: col.header,
                data: data.map((r) => r[col.field]),
                backgroundColor: colors[i % colors.length],
                borderRadius: 4,
                barThickness: 14
            }))
        };
         this.labourChartOptions = { ...this.labourChartOptions };
    }

      initLabourChart() {
        this.labourChartData = {
            labels: [],
            datasets: []
        };

        this.labourChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { size: 11 }, boxWidth: 12, padding: 10 }
                },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, stepSize:100 } }
            }
        };
    }

 initPaymentChart() {
        this.paymentChartData = {
            labels: ['Haziri Payment', 'Kharchi', 'Advance Payment', 'Mobilization Kharchi'],
            datasets: [
                {
                    data: [1245000, 780000, 625000, 225000],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'],
                    borderWidth: 0,
                    hoverOffset: 4
                }
            ]
        };

        this.paymentChartOptions = {
            responsive: false,
            cutout: '72%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => ` ₹${(ctx.parsed / 100000).toFixed(2)}L`
                    }
                }
            }
        };
    }


    downloadExcel(type: 'attendanceBifurcation') {
        const configMap = {
            attendanceBifurcation: {
                data: this.attendanceBifurcation,
                columns: this.attendanceBifurcationColumns,
                sheetName: 'Attendance Bifurcation',
                fileName: 'Attendance-Bifurcation.xlsx'
            }
        };

        const { data, columns, sheetName, fileName } = configMap[type];

        const exportData = data.map((item: any) => {
            const row: any = {};
            columns.forEach((col: any) => {
                row[col.header] = item[col.field];
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        FileSaver.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), fileName);
    }
}
