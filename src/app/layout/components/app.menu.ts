import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/core/services/auth.service';
import { MENU_MODEL } from '@/core/config/menu.config';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { DropdownParamter } from '@/core/models/setup.model';
import { forkJoin } from 'rxjs';
import { PermissionService } from '@/core/services/permissionService.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule,],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li
                app-menuitem
                *ngIf="!item.separator"
                [item]="item"
                [index]="i"
                [root]="true"
            ></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `,
})
export class AppMenu {
    model: any[] = [];
    allPermission:any[]=[];
    availablePermission:any[]=[];
    public role:string=''
    constructor(
        public userservice:AuthService,
        private setupService: SetupMaintainceService,
        private permissionService: PermissionService,
        private authService: AuthService
    ){
      
    }

    ngOnInit() {
       const userType:any = this.userservice.isLogIntType().permissiontype; 
    const allPermissionPayload: DropdownParamter = {
        returnType: 'ACCESSPERMISSION',
        returnValue: 'W',
        username: ''
    };

     const accessControlPayload: DropdownParamter = {
                returnType: 'ACCESSCONTROL',
                returnValue: userType,
                username: ''
            };
            // this.model=MENU_MODEL;
            this.permissionService.getAllowedPermissions().subscribe({
                next:(allowedPermissions)=>{
                   this. model = this.filterMenuByPermissions(MENU_MODEL,allowedPermissions);
                },
                error:()=>{
                    this.model=MENU_MODEL
                }
            });
}

 private filterMenuByPermissions(menuItems: any[], allowed: string[]): any[] {
        return menuItems
            .map((item: any) => {
                if (item.items?.length > 0) {
                    const children = this.filterMenuByPermissions(item.items, allowed);
                    return children.length > 0 ? { ...item, items: children } : null;
                }
                if (item.permissionKey) {
                    return allowed.includes(item.permissionKey) ? item : null;
                }
                return item;
            })
            .filter(Boolean);
    }
}
