import { Routes } from '@angular/router';
import { UserCreate } from '../user-management/usercreate';
import { NewPassword } from '../user-management/changepassword';
import { FundAllocationComponent } from './fund-allocation/fund-allocation.component';
import { AttendanceRuleComponent } from './attendance-rule/attendance-rule.component';

export default [
    { path: 'fund-allocation', component: FundAllocationComponent },
    { path: 'attendance-rule', component: AttendanceRuleComponent },
    { path: 'profile', component: UserCreate },
    { path: 'changepassword', component: NewPassword },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
