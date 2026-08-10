// permission.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { map } from 'rxjs';
import { PermissionService } from '../services/permissionService.service';

const ROUTE_PERMISSION_MAP: Record<string, string> = {
    '/layout/setup/user':                       'USER',
    '/layout/setup/user-type':                  'USER_TYPE',
    '/layout/setup/user-security':              'SECURITY_CONTROL',
    '/layout/project-maintenance/project':      'SITE',
    '/layout/project-maintenance/tower':        'TOWER',
    '/layout/project-maintenance/rule-detail':  'RULE_DETAIL',
    '/layout/approval/my-approval':             'MY_APPROVAL',
    '/layout/fund/fund-allocation':             'FUND_ALLOCATION',
    '/layout/fund/attendance-rule':             'BULK_ATTENDANCE',
    '/layout/reports/daily-labour':             'DAILY_LABOUR_REPORT',
    '/layout/reports/worker-onboarding':        'WORKER_ONBOARDING',
};

export const permissionGuard: CanActivateFn = (route, state) => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    // Query params hata do URL se
    const cleanUrl = state.url.split('?')[0];
    const requiredKey = ROUTE_PERMISSION_MAP[cleanUrl];

    // No permission key = public route, allow karo
    if (!requiredKey) return true;

    return permissionService.getAllowedPermissions().pipe(
        map(allowed => {
            if (allowed.includes(requiredKey)) return true;

            // Permission nahi → dashboard pe redirect
            router.navigate(['/layout/dashboard']);
            return false;
        })
    );
};