import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';
import { Landing } from '@/pages/landing/landing';
import { Notfound } from '@/pages/notfound/notfound';
import { AuthGuard } from '@/core/guards/auth.guard';
import { RoleGaurd } from '@/core/guards/role.guard';
import { permissionGuard } from '@/core/guards/permission.guard';


export const appRoutes: Routes = [
    {
        path: 'layout',
        component: AppLayout,
        canActivate:[AuthGuard],
        children: [
             {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                canActivate: [permissionGuard],
                loadComponent: () => import('./app/pages/dashboards/ecommercedashboard').then((c) => c.EcommerceDashboard),
            },
            {
                path: 'company-setup',
                canActivate:[permissionGuard],
                loadChildren:()=> import('@/pages/company/company.router'),
            },
            {
                path: 'setup',
                canActivate: [permissionGuard],
                loadChildren: () => import('@/pages/setup/setup.routers'),
            },
            {
                path: 'project-maintenance',
                canActivate: [permissionGuard],
                loadChildren: () => import('@/pages/project-maintenance/project-maintenance.routers'),
            },
            {
                path: 'approval',
                canActivate: [permissionGuard],
                loadChildren: () => import('@/pages/approval/approval.routers'),
            },
            {
                path: 'reports',
                canActivate: [permissionGuard],
                loadChildren: () => import('@/pages/reports/reports.router'),
            },

            {
                path: 'fund',
                canActivate: [permissionGuard],
                loadChildren: () => import('@/pages/fund/fund.routers'),
            }
        ]
    },
   
    { path: 'notfound', component: Notfound },
    {
        path: '',
        loadChildren: () => import('@/pages/auth/auth.routes'),
    },
    { path: '**', redirectTo: '/notfound' }
];
