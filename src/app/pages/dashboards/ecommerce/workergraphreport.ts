import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { FormsModule } from '@angular/forms';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { ChartModule } from 'primeng/chart';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { AuthService } from '@/core/services/auth.service';
import { DropdownParamter } from '@/core/models/setup.model';
import { RecordReportService } from '@/core/services/reportService';
import { DashboardsService } from '@/core/services/dashboardCard.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
interface Week {
    label: string;
    value: number;
    data: number[][];
}

@Component({
    standalone: true,
    selector: 'app-worker-graph-report',
    imports: [CommonModule, FormsModule, CardModule, TableModule, TagModule, PaginatorModule, IconFieldModule, InputIconModule, ChartModule],

    template: `
        <div class="grid grid-cols-3 gap-4 mb-6">
            <!-- Group Wised -->
            <div class="card-panel">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="panel-title mb-0">Group Wise DLR</h3>
                    <a class="view-link mb-0" (click)="downloadExcel('groupwise')">Download</a>
                </div>
                <p-table [value]="groupwise || []" styleClass="approval-table" [scrollable]="true" scrollHeight="300px">
                    <ng-template pTemplate="header">
                        <tr>
                            <th class="table-th" *ngFor="let col of groupwiseColumns">{{ col.header }}</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-row>
                        <tr class="table-row">
                            <td class="table-td text-xs" *ngFor="let col of groupwiseColumns">{{ row[col.field] }}</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <!-- Daily Attendance Grouped Bar Chart -->
            <div class="card-panel">
                <h3 class="panel-title">Daily Attendance</h3>
                <p-chart type="bar" [data]="attendanceChartData" [options]="attendanceChartOptions" height="300px"></p-chart>
                <!-- <a class="view-link mt-2">View attendance</a> -->
            </div>

            <!-- Site Wised -->
            <div class="card-panel">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="panel-title mb-0">Site Wise DLR</h3>
                    <a class="view-link mb-0" (click)="downloadExcel('projectwise')">Download</a>
                </div>
                <p-table [value]="projectwise || []" styleClass="approval-table" [scrollable]="true" scrollHeight="300px">
                    <ng-template pTemplate="header">
                        <tr>
                            <th class="table-th" *ngFor="let col of projectwiseColumns">{{ col.header }}</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-row>
                        <tr class="table-row">
                            <td class="table-td text-xs" *ngFor="let col of projectwiseColumns">{{ row[col.field] }}</td>
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
            display: block;

            &:hover {
                text-decoration: underline;
            }
        }
        // ── Attendance / Chart Legend ──────────────────────────
        .attendance-legend {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .legend-row {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .legend-label {
            font-size: 11px;
            color: #6b7280;
            flex: 1;
        }

        .legend-val {
            font-size: 11px;
            font-weight: 600;
            color: #374151;
        }

        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        // ── Tables ─────────────────────────────────────────────
        .approval-table {
            .p-datatable-thead > tr > th {
                background: #f8fafc !important;
                color: #6b7280 !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                padding: 6px 8px !important;
                border-bottom: 1px solid #e5e7eb !important;
            }

            .p-datatable-tbody > tr > td {
                padding: 6px 8px !important;
                border-bottom: 1px solid #f3f4f6 !important;
                color: #374151 !important;
            }

            .p-datatable-tbody > tr:hover > td {
                background: #f8fafc !important;
            }
        }

        .table-th {
            background: #f8fafc;
            color: #6b7280;
            font-size: 11px;
            font-weight: 600;
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        .table-td {
            padding: 6px 8px;
            border-bottom: 1px solid #f3f4f6;
            color: #374151;
            vertical-align: middle;
        }

        .table-row:hover td {
            background: #f8fafc;
        }
    `
})
export class WorkerGraphReport implements OnInit {
    @Input() filters: { project: any; groupLeader: any; period: any } = {
        project: null,
        groupLeader: null,
        period: null
    };

    groupwise: any[] = [];
    groupwiseColumns: any[] = [];
    projectwise: any[] = [];
    projectwiseColumns: any[] = [];

    labourAttendance: any[] = [];
    labourAttendanceColumns: any[] = [];

    // ── Daily Attendance Grouped Bar ────────────────────
    attendanceChartData: any;
    attendanceChartOptions: any;
    companyId = '';
    constructor(
        private dashboardService: DashboardsService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        this.initAttendanceChart();
        this.applyFilters();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.companyId = this.authService.isLogIntType()?.companyid.toString();
        if (changes['filters']) {
            this.applyFilters();
        }
    }

    loadDropdown(type: string, value: string, key: 'labourAttendance' | 'groupwise' | 'projectwise') {
        const payload: DropdownParamter = {
            returnType: type,
            returnValue: value,
            username: this.authService.isLogIntType()?.userid.toString(),
            option1: this.companyId,
            option2: ''
        };
        this.dashboardService.onGetReportDetails(payload).subscribe({
            next: (res) => {
                this[key] = res.data.data;
                if (key === 'groupwise') {
                    this.groupwiseColumns = res.data.columns;
                    if (this.filters.groupLeader) {
                        const filterVal = this.filters.groupLeader.toLowerCase().trim();
                        this[key] = (res.data.data ?? []).filter((row: any) => {
                            const glName = row.group_leader?.toLowerCase().trim() ?? '';
                            return glName.includes(filterVal) || filterVal.includes(glName);
                        });
                    } else {
                        this[key] = res.data.data ?? [];
                    }
                }

                if (key === 'projectwise') this.projectwiseColumns = res.data.columns;

                if (key === 'labourAttendance') {
                    this.labourAttendanceColumns = res.data.columns;
                    if (value === null) {
                        this.buildAttendanceChart(res.data.columns, res.data.data);
                    } else {
                        this.buildAttendanceChartByDate(res.data.columns, res.data.data);
                    }
                }
            }
        });
    }

    applyFilters() {
        this.initAttendanceChart();
        if (this.groupwise) {
            let value = this.filters.project ?? null;
            this.loadDropdown('REPORTDLR3DAY', value, 'groupwise');
        }

        if (this.projectwise) {
            const value = this.filters.project ?? null;
            this.loadDropdown('REPORTDLR3DAYPROJECT', value, 'projectwise');
        }

        if (this.labourAttendance) {
            const value = this.filters.project ?? null;
            this.loadDropdown('REPORTDLR7DAY', value, 'labourAttendance');
        }
    }

    buildAttendanceChart(columns: any[], data: any[]) {
        if (!data || !data.length) return;

        // Get unique total_active per project (avoid multiplying by date count)
        const projectActiveMap: Record<number, number> = {};
        for (const row of data) {
            if (!(row.project_id in projectActiveMap)) {
                projectActiveMap[row.project_id] = row.total_active ?? 0;
            }
        }
        const grandTotalActive = Object.values(projectActiveMap).reduce((a, b) => a + b, 0);

        // Group attendance by date
        const grouped: Record<string, number> = {};
        for (const row of data) {
            const key = row.attendance_date.trim();
            if (!grouped[key]) grouped[key] = 0;
            grouped[key] += row.attendance ?? 0;
        }

        const labels = Object.keys(grouped);
        if (!labels.length) return;

        this.attendanceChartData = {
            labels,
            datasets: [
                {
                    label: 'Total Attendance',
                    data: labels.map((k) => grouped[k]),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4,
                    barThickness: 14
                },
                {
                    label: 'Total Active',
                    // Same value across all dates (flat reference line)
                    data: labels.map(() => grandTotalActive),
                    backgroundColor: '#f59e0b',
                    borderRadius: 4,
                    barThickness: 14,
                    type: 'line', // ✅ show as line so it's clearly a reference
                    borderColor: '#f59e0b',
                    borderWidth: 2,
                    pointRadius: 3,
                    fill: false
                }
            ]
        };
    }

    buildAttendanceChartByDate(columns: any[], data: any[]) {
        if (!data) return;

        const labels = data.map((r) => r.attendance_date);
        const metricColumns = columns.filter((col) => col.field !== 'project_name' && col.field !== 'attendance_date');
        const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4'];

        this.attendanceChartData = {
            labels,
            datasets: metricColumns.map((col, i) => ({
                label: col.header,
                data: data.map((r) => r[col.field]),
                backgroundColor: colors[i % colors.length],
                borderRadius: 4,
                barThickness: 14
            }))
        };
    }

    initAttendanceChart() {
        this.attendanceChartData = {
            labels: [],
            datasets: []
        };

        this.attendanceChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 }, boxWidth: 12, padding: 10 }
                },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } }
                },
                y: {
                    grid: { color: '#f3f4f6' },
                    ticks: { font: { size: 10 } },
                    beginAtZero: true
                }
            }
        };
    }

    downloadExcel(type: 'groupwise' | 'projectwise') {
        const configMap = {
            groupwise: {
                data: this.groupwise,
                columns: this.groupwiseColumns,
                sheetName: 'Group Wise DLR',
                fileName: 'Group-Wise-DLR.xlsx'
            },
            projectwise: {
                data: this.projectwise,
                columns: this.projectwiseColumns,
                sheetName: '',
                fileName: 'Site-Wise-DLR.xlsx'
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
