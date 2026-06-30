import { Routes } from '@angular/router';
import { UserTypeComponent } from './user-type/user-type.component';
import { UserComponent } from './user/user.component';
import { UserSecurityComponent } from './user-security/user-security.component';
import { UserCreate } from '../user-management/usercreate';
import { NewPassword } from '../user-management/changepassword';

export default [
    { path: 'user-type', component: UserTypeComponent },
    { path: 'user', component: UserComponent },
    { path: 'user-security', component: UserSecurityComponent },
    { path: 'profile', component: UserCreate },
    { path: 'changepassword', component: NewPassword },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
