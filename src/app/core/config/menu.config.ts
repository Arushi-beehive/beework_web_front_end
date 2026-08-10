import { MenuItem } from 'primeng/api';

export const MENU_MODEL: MenuItem[] = [
    {
        label: 'DASHBOARD',
        icon: 'pi pi-home',
        routerLink: ['/'],
        items: [
            {
                label: 'Main Dashboard',
                icon: 'pi pi-fw pi-home',
                routerLink: ['/layout/dashboard']
            }
        ]
    },
    {
        label: 'SUPER USER ACCESS',
        icon: 'pi pi-building-columns',
        items: [
            {
                label: 'Company',
                icon: 'pi pi-fw pi pi-building-columns',
                routerLink: ['/layout/setup/overview'],
                items: [
                    {
                        label: 'Company Setup',
                        icon: 'pi pi-fw pi-crown',
                        routerLink: ['/layout/company-setup/company-setup'],
                        permissionKey: 'COMPANY_SETUP'
                    },
                     {
                        label: 'Subscription',
                        icon: 'pi pi-fw pi-paypal',
                        routerLink: ['/layout/company-setup/subscription'],
                        permissionKey: 'SUBSCRIPTION'
                    }
                ]
                }
        ]
    },
    {
        label: 'SETUP',
        icon: 'pi pi-cog',
        items: [
            {
                label: 'Setup Management',
                icon: 'pi pi-fw pi-cog',
                routerLink: ['/layout/setup/overview'],
                items: [
                    {
                        label: 'User Type',
                        icon: 'pi pi-fw pi-user',
                        routerLink: ['/layout/setup/user-type'],
                        permissionKey: 'USER_TYPE' 
                    },
                    {
                        label: 'User',
                        icon: 'pi pi-fw pi-user-edit',
                        routerLink: ['/layout/setup/user'],
                        permissionKey: 'USER' 
                    },
                    {
                        label: 'Security Control',
                        icon: 'pi pi-fw pi-shield',
                        routerLink: ['/layout/setup/user-security'],
                        permissionKey: 'SECURITY_CONTROL'
                    }
                ]
            }
        ]
    },
    {
        label: 'PROJECT',
        icon: 'pi pi-box',
        items: [
            {
                label: 'Site Maintenance',
                icon: 'pi pi-fw pi-briefcase',
                routerLink: ['/layout/project-maintenance/overview'],
                items: [
                    {
                        label: 'Site',
                        icon: 'pi pi-fw pi-folder',
                        routerLink: ['/layout/project-maintenance/project'],
                        permissionKey: 'SITE'
                    },
                     {
                        label: 'Tower',
                        icon: 'pi pi-fw pi-building',
                        routerLink: ['/layout/project-maintenance/tower'],
                        permissionKey: 'TOWER' 
                    },
                    {
                        label: 'Rule Detail',
                        icon: 'pi pi-fw pi-sliders-h',
                        routerLink: ['/layout/project-maintenance/rule-detail'],
                        permissionKey: 'RULE_DETAIL'
                    }
                ]
            }
        ]
    },
    {
        label: 'APPROVAL',
        icon: 'pi pi-shopping-cart',
        items: [
            {
                label: 'My Approval',
                icon: 'pi pi-fw pi-check-square',
                routerLink: ['/layout/approval/my-approval'],
                permissionKey: 'MY_APPROVAL'
            }
        ]
    },
    {
        label: 'ACTION',
        icon: 'pi pi-calculator',
        items: [
           { label: 'Actions',
                icon: 'pi pi-fw pi-shield',
                routerLink: ['/layout/fund/overview'],
                items:[
            {
                label: 'Fund Allocation',
                icon: 'pi pi-fw pi-wallet',
                routerLink: ['/layout/fund/fund-allocation'],
                permissionKey: 'FUND_ALLOCATION'
            },
             {
                label: 'Bulk Attendance',
                icon: 'pi pi-fw pi-calendar',
                routerLink: ['/layout/fund/attendance-rule'],
                permissionKey: 'BULK_ATTENDANCE'
            }
        ]
    }
]
    },
    {
        label: 'REPORT',
        icon: 'pi pi-cog',
        items: [
           { label: 'Reports',
                icon: 'pi pi-fw pi-chart-bar',
                routerLink: ['/layout/reports/overview'],
                items:[
             {
                label: 'Daily Labour Report',
                icon: 'pi pi-fw pi-calendar-clock',
                routerLink: ['/layout/reports/daily-labour'],
                permissionKey: 'DAILY_LABOUR_REPORT'
            },
            {
                label: 'Worker Onboarding',
                icon: 'pi pi-fw pi-user-plus',
                routerLink: ['/layout/reports/worker-onboarding'],
                permissionKey: 'WORKER_ONBOARDING'
            },
            {
                label: 'Worker In-Out',
                icon: 'pi pi-fw pi-users',
                routerLink: ['/layout/reports/total-worker-onboarding'],
                permissionKey: 'WORKER_IN-OUT'
            },
            {
                label: 'Worker Payment',
                icon: 'pi pi-fw pi-money-bill',
                routerLink: ['/layout/reports/worker-payment'],
                permissionKey: 'WORKER_PAYMENT'
            },
             {
                label: 'Expense Report',
                icon: 'pi pi-fw pi-receipt',
                routerLink: ['/layout/reports/expense-report'],
                permissionKey: 'EXPENSE_REPORT'
            },
            {
                label: 'Worker Wages',
                icon: 'pi pi-fw pi-indian-rupee',
                routerLink: ['/layout/reports/worker-wages'],
                permissionKey: 'WORKER_WAGES'
            },
        ]
    },
]
    }
];
