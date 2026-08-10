import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '@/layout/service/layout.service';
import { AppBreadcrumb } from './app.breadcrumb';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { UserService } from '@/core/services/user.service';
import { InventoryService } from '@/core/services/inventory.service';
import { AuthService } from '@/core/services/auth.service';
import { SetupMaintainceService } from '@/core/services/setup-maintaince.service';
import { DropdownParamter } from '@/core/models/setup.model';

@Component({
    selector: '[app-topbar]',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppBreadcrumb, InputTextModule, ButtonModule, IconFieldModule, InputIconModule],
    template: `<div class="layout-topbar">
        <div class="topbar-start">
            <button #menubutton type="button" class="topbar-menubutton p-link p-trigger" (click)="onMenuButtonClick()">
                <i class="pi pi-bars"></i>
            </button>

            <div class="flex items-center gap-2">
                <img
                    [src]="companyLogo"
                    alt="logo"
                    class="w-[60px] h-[60px]
         object-contain"
                />
                <p class="text-2xl font-bold text-primary">{{ companyName }}</p>
            </div>

            <nav app-breadcrumb class="topbar-breadcrumb"></nav>
        </div>

        <div class="topbar-end">
            <ul class="topbar-menu">
                <!-- <li class="topbar-search">
                    <p-iconfield>
                        <p-inputicon class="pi pi-search" />
                        <input type="text" pInputText placeholder="Search" class="w-48 sm:w-full" />
                    </p-iconfield>
                </li> -->
                <li class="ml-3">
                    <p-button icon="pi pi-palette" rounded (onClick)="onConfigButtonClick()"></p-button>
                </li>
                <li class="topbar-profile">
                    <button type="button" class="p-link" (click)="onProfileButtonClick()">
                        <img src="/layout/images/avatar.png" alt="Profile" />
                    </button>
                </li>
            </ul>
        </div>
    </div>`
})
export class AppTopbar {
    @ViewChild('menubutton') menuButton!: ElementRef;
    companyName: string = 'OSO Construction';
    companyLogo: string = '/layout/images/BeeWork_with_Title_noBG.png';
    companyId = '';

    public imageUrl: string = '';
    constructor(
        public layoutService: LayoutService,
        private authservice: AuthService,
        private setupService:SetupMaintainceService
    ) {}
    ngOnInit() {
        this.onGetData();
        this.companyId = this.authservice.isLogIntType()?.companyid.toString();
    }
    onMenuButtonClick() {
        this.layoutService.onMenuToggle();
    }

    onProfileButtonClick() {
        this.layoutService.showProfileSidebar();
    }

    onConfigButtonClick() {
        this.layoutService.showConfigSidebar();
    }
    createDropdownPayload(returnType: string) {
        return {
            uname: 'admin',
            p_username: 'admin',
            p_returntype: returnType
        };
    }
    onGetData() {
        let companyId = this.authservice.isLogIntType().companyid.toString();
                let userId = this.authservice.isLogIntType()?.userid;
                  const payload: DropdownParamter = {
                      returnType: 'COMPANYPROFILE',
                      returnValue: companyId,
                      username: userId,
                     option1: this.companyId,
                      option2:''
                  };
          
                  this.setupService.onDropdownDetailsPublic(payload).subscribe({
                      next: (res) => {
                        if(res.data){
                        this.companyName = res.data[0].companyname;
                        this.companyLogo = res.data[0].companylogo;
                      }
                    }
                  });
    }
}
