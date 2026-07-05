// permission.service.ts
import { Injectable } from '@angular/core';
import { forkJoin, Observable, BehaviorSubject } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { DropdownParamter } from '@/core/models/setup.model';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { AuthService } from '@/core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {

    private permissionsCache$: Observable<string[]> | null = null;
    private loadedPermissions: string[] | null = null;

    constructor(
        private setupService: SetupMaintainceService,
        private authService: AuthService
    ) {}

    getAllowedPermissions(): Observable<string[]> {
        if (this.permissionsCache$) return this.permissionsCache$;
        
        const userType = this.authService.isLogIntType().permissiontype;
        const allPermissionPayload: DropdownParamter = {
            returnType: 'ACCESSPERMISSION', returnValue: 'W', username: ''
        };
        const accessControlPayload: DropdownParamter = {
            returnType: 'ACCESSCONTROL', returnValue: userType, username: ''
        };

        this.permissionsCache$ = forkJoin({
            allPermissions: this.setupService.onDropdownDetails(allPermissionPayload),
            userAccess: this.setupService.onDropdownDetails(accessControlPayload)
        }).pipe(
            map(({ allPermissions, userAccess }) => {
                const excluded = new Set(
                    userAccess.data
                        .filter((i: any) => i.permission_type === 'W')
                        .map((i: any) => i.access_name)
                );
                return allPermissions.data
                    .filter((i: any) => !excluded.has(i.access_name))
                    .map((i: any) => i.access_name);
            }),
            tap(permissions => this.loadedPermissions = permissions), // store sync snapshot
            shareReplay(1)
        );

        return this.permissionsCache$;
    }

    clearCache(): void {
        this.permissionsCache$ = null;
        this.loadedPermissions = null;
    }
}