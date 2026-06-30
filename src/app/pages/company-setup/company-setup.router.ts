import { Routes } from '@angular/router';
import { CompanyManagementComponent } from './company-management/company-management.component';
import { CompanySubscriptionComponent } from './company-subscription/company-subscription.component';

export default [
    { path: 'company-management', component: CompanyManagementComponent },
    { path: 'company-subscription', component: CompanySubscriptionComponent }
] as Routes;
