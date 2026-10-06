import { Routes } from '@angular/router';
import { UserCreate } from '../user-management/usercreate';
import { NewPassword } from '../user-management/changepassword';
import { FundAllocationComponent } from './fund-allocation/fund-allocation.component';
import { AttendanceRuleComponent } from './attendance-rule/attendance-rule.component';
import { HaziriAllocationComponent } from './haziri-allocation/haziri-allocation.component';
import { NewFundAllocationComponent } from './new-fund-allocation/new-fund-allocation.component';

export default [
    { path: 'fund-allocation', component: FundAllocationComponent },
    { path: 'haziri-allocation', component: HaziriAllocationComponent },
    { path: 'attendance-rule', component: AttendanceRuleComponent },
    { path: 'profile', component: UserCreate },
    { path: 'changepassword', component: NewPassword },
    { path: 'new-fund-allocation', component: NewFundAllocationComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;