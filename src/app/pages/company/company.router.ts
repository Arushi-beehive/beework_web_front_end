import { Routes } from '@angular/router';
import { CompanySetupComponent } from './company-setup/company-setup.component';
import { SubscriptionComponent } from './subscription/subscription.component';

export default [
    { path: 'company-setup', component: CompanySetupComponent },
    { path: 'subscription', component: SubscriptionComponent }
] as Routes;
