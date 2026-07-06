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
                label: 'Project Maintenance',
                icon: 'pi pi-fw pi-briefcase',
                routerLink: ['/layout/project-maintenance/overview'],
                items: [
                    {
                        label: 'Project',
                        icon: 'pi pi-fw pi-folder',
                        routerLink: ['/layout/project-maintenance/project'],
                        permissionKey: 'PROJECT'
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
                permissionKey: 'WORKER_ONBOARDING'
            },
            {
                label: 'Worker Payment',
                icon: 'pi pi-fw pi-money-bill',
                routerLink: ['/layout/reports/worker-payment'],
            },
            {
                label: 'Worker Haziri',
                icon: 'pi pi-fw pi-indian-rupee',
                routerLink: ['/layout/reports/worker-haziri'],
            },
        ]
    },
]
    }
];

////Second Menu

// export const SALES_MANAGER_MENU_MODEL: MenuItem[] = [
//     {
//         label: 'DASHBOARD',
//         icon: 'pi pi-home',
//         routerLink: ['/'],
//         items: [
//             {
//                 label: 'Dashboard',
//                 icon: 'pi pi-fw pi-home',
//                 routerLink: ['/layout/dashboard']
//             }
//         ]
//     },
//     {
//         label: 'INVENTORY',
//         icon: 'pi pi-chart-bar',
//         items: [
//             {
//                 label: 'Inventory Management',
//                 icon: 'pi pi-fw pi-database',
//                 routerLink: ['/layout/inventory/overview'],
//                 items: [
//                     {
//                         label: 'Stock In',
//                         icon: 'pi pi-fw pi-arrow-down-left',
//                         routerLink: ['/layout/inventory/stock-in']
//                     },
//                     // {
//                     //   label: 'Stock Adjustment',
//                     //   icon: 'pi pi-fw pi-wrench',
//                     //   routerLink: ['/layout/inventory/stock-adjustment'],
//                     // },
//                     {
//                         label: 'Transactions',
//                         icon: 'pi pi-fw pi-history',
//                         routerLink: ['/layout/inventory/transaction']
//                     }
//                 ]
//             }
//         ]
//     },
//     {
//         label: 'PRODUCTS',
//         icon: 'pi pi-box',
//         items: [
//             {
//                 label: 'Product Management',
//                 icon: 'pi pi-fw pi-tags',
//                 routerLink: ['/layout/products/overview'],
//                 items: [
//                     {
//                         label: 'Item List',
//                         icon: 'pi pi-fw pi-list-check',
//                         routerLink: ['/layout/products/list']
//                     }
//                 ]
//             }
//         ]
//     },
//     {
//         label: 'POS',
//         icon: 'pi pi-shopping-cart',
//         items: [
//             {
//                 label: 'Point of Sale',
//                 icon: 'pi pi-fw pi-desktop',
//                 routerLink: ['/layout/pos/overview'],
//                 items: [
//                     {
//                         label: 'Sales',
//                         icon: 'pi pi-fw pi-dollar',
//                         routerLink: ['/layout/pos/sales']
//                     },
//                     {
//                         label: 'Return',
//                         icon: 'pi pi-fw pi-arrow-left',
//                         routerLink: ['/layout/pos/return']
//                     },
//                     {
//                         label: 'Replace',
//                         icon: 'pi pi-fw pi-arrow-right-arrow-left',
//                         routerLink: ['/layout/pos/replace']
//                     },
//                     {
//                         label: 'Invoice',
//                         icon: 'pi pi-fw pi-file',
//                         routerLink: ['/layout/pos/invoice']
//                     },
//                     {
//                         label: 'Debit/Credit Link',
//                         icon: 'pi pi-fw pi-credit-card',
//                         routerLink: ['/layout/pos/credit-note']
//                     }
//                 ]
//             }
//         ]
//     },
//     {
//         label: 'REPORTS',
//         icon: 'pi pi-calculator',
//         items: [
//             {
//                 label: 'Reports Center',
//                 icon: 'pi pi-fw pi-chart-bar',
//                 routerLink: ['/layout/reports/overview'],
//                 items: [
//                     {
//                         label: 'Item Report',
//                         icon: 'pi pi-fw pi-box',
//                         routerLink: ['/layout/reports/item-report']
//                     },
//                     {
//                         label: 'Transaction Report',
//                         icon: 'pi pi-fw pi-chart-line',
//                         routerLink: ['/layout/reports/transaction-report']
//                     }
//                 ]
//             }
//         ]
//     },
//     {
//         label: 'SETTINGS',
//         icon: 'pi pi-cog',
//         items: [
//             {
//                 label: 'System Settings',
//                 icon: 'pi pi-fw pi-cog',
//                 routerLink: ['/layout/settings/overview'],
//                 items: [
//                     {
//                         label: 'User Management',
//                         icon: 'pi pi-fw pi-users',
//                         routerLink: ['/layout/settings/user-management']
//                     }
//                 ]
//             }
//         ]
//     }
// ];
// export const STORE_OWNER_MENU_MODEL: MenuItem[] = [
//     {
//         label: 'DASHBOARD',
//         icon: 'pi pi-home',
//         routerLink: ['/'],
//         items: [
//             {
//                 label: 'Dashboard',
//                 icon: 'pi pi-fw pi-home',
//                 routerLink: ['/layout/dashboard']
//             }
//         ]
//     },
//      {
//         label: 'INVENTORY',
//         icon: 'pi pi-chart-bar',
//         items: [
//             {
//                 label: 'Inventory Management',
//                 icon: 'pi pi-fw pi-database',
//                 routerLink: ['/layout/inventory/overview'],
//                 items: [
//                     {
//                         label: 'Transactions',
//                         icon: 'pi pi-fw pi-history',
//                         routerLink: ['/layout/inventory/transaction']
//                     }
//                 ]
//             }
//         ]
//     },
//     {
//         label: 'POS',
//         icon: 'pi pi-shopping-cart',
//         items: [
//             {
//                 label: 'Point of Sale',
//                 icon: 'pi pi-fw pi-desktop',
//                 routerLink: ['/layout/pos/overview'],
//                 items: [
//                     {
//                         label: 'Invoice',
//                         icon: 'pi pi-fw pi-file',
//                         routerLink: ['/layout/pos/invoice']
//                     }
//                 ]
//             }
//         ]
//     },
//     {
//         label: 'REPORTS',
//         icon: 'pi pi-calculator',
//         items: [
//             {
//                 label: 'Reports Center',
//                 icon: 'pi pi-fw pi-chart-bar',
//                 routerLink: ['/layout/reports/overview'],
//                 items: [
//                     {
//                         label: 'Item Report',
//                         icon: 'pi pi-fw pi-box',
//                         routerLink: ['/layout/reports/item-report']
//                     },
//                     {
//                         label: 'Transaction Report',
//                         icon: 'pi pi-fw pi-chart-line',
//                         routerLink: ['/layout/reports/transaction-report']
//                     }
//                 ]
//             }
//         ]
//     }
// ];
// export const SALES_REP_MENU_MODEL: MenuItem[] = [
//     {
//         label: 'DASHBOARD',
//         icon: 'pi pi-home',
//         routerLink: ['/'],
//         items: [
//             {
//                 label: 'Dashboard',
//                 icon: 'pi pi-fw pi-home',
//                 routerLink: ['/layout/dashboard']
//             }
//         ]
//     },
//     {
//         label: 'INVENTORY',
//         icon: 'pi pi-chart-bar',
//         items: [
//             {
//                 label: 'Inventory Management',
//                 icon: 'pi pi-fw pi-database',
//                 routerLink: ['/layout/inventory/overview'],
//                 items: [
//                     {
//                         label: 'Stock In',
//                         icon: 'pi pi-fw pi-arrow-down-left',
//                         routerLink: ['/layout/inventory/stock-in']
//                     },
//                     // {
//                     //   label: 'Stock Adjustment',
//                     //   icon: 'pi pi-fw pi-wrench',
//                     //   routerLink: ['/layout/inventory/stock-adjustment'],
//                     // },
//                     {
//                         label: 'Transactions',
//                         icon: 'pi pi-fw pi-history',
//                         routerLink: ['/layout/inventory/transaction']
//                     }
//                 ]
//             }
//         ]
//     },
//     {
//         label: 'PRODUCTS',
//         icon: 'pi pi-box',
//         items: [
//             {
//                 label: 'Product Management',
//                 icon: 'pi pi-fw pi-tags',
//                 routerLink: ['/layout/products/overview'],
//                 items: [
//                     {
//                         label: 'Item List',
//                         icon: 'pi pi-fw pi-list-check',
//                         routerLink: ['/layout/products/list']
//                     }
//                 ]
//             }
//         ]
//     },
//     {
//         label: 'POS',
//         icon: 'pi pi-shopping-cart',
//         items: [
//             {
//                 label: 'Point of Sale',
//                 icon: 'pi pi-fw pi-desktop',
//                 routerLink: ['/layout/pos/overview'],
//                 items: [
//                     {
//                         label: 'Sales',
//                         icon: 'pi pi-fw pi-dollar',
//                         routerLink: ['/layout/pos/sales']
//                     },
//                     {
//                         label: 'Return',
//                         icon: 'pi pi-fw pi-arrow-left',
//                         routerLink: ['/layout/pos/return']
//                     },
//                     // {
//                     //   label: 'Replace',
//                     //   icon: 'pi pi-fw pi-arrow-right-arrow-left',
//                     //   routerLink: ['/layout/pos/replace'],
//                     // },
//                     {
//                         label: 'Invoice',
//                         icon: 'pi pi-fw pi-file',
//                         routerLink: ['/layout/pos/invoice']
//                     }
//                     // {
//                     //   label: 'Debit/Credit Link',
//                     //   icon: 'pi pi-fw pi-credit-card',
//                     //   routerLink: ['/layout/pos/credit-note'],
//                     // }
//                 ]
//             }
//         ]
//     },
//     {
//         label: 'REPORTS',
//         icon: 'pi pi-calculator',
//         items: [
//             {
//                 label: 'Reports Center',
//                 icon: 'pi pi-fw pi-chart-bar',
//                 routerLink: ['/layout/reports/overview'],
//                 items: [
//                     {
//                         label: 'Item Report',
//                         icon: 'pi pi-fw pi-box',
//                         routerLink: ['/layout/reports/item-report']
//                     },
//                     {
//                         label: 'Transaction Report',
//                         icon: 'pi pi-fw pi-chart-line',
//                         routerLink: ['/layout/reports/transaction-report']
//                     }
//                 ]
//             }
//         ]
//     },
//     {
//         label: 'SETTINGS',
//         icon: 'pi pi-cog',
//         items: [
//             {
//                 label: 'System Settings',
//                 icon: 'pi pi-fw pi-cog',
//                 routerLink: ['/layout/settings/overview'],
//                 items: [
//                     {
//                         label: 'User Management',
//                         icon: 'pi pi-fw pi-users',
//                         routerLink: ['/layout/settings/user-management']
//                     }
//                 ]
//             }
//         ]
//     }
// ];
