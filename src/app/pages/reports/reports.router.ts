import { Routes } from '@angular/router';
import { DailyLabourComponent } from './daily-labour/daily-labour.component';
import { WorkerOnboardingComponent } from './worker-onboarding/worker-onboarding.component';
import { WorkerPaymentComponent } from './worker-payment/worker-payment.component';
import { TotalWorkerOnboardingComponent } from './attendance-in-out/total-worker-onboarding.component';
import { WorkerHaziriComponent } from './worker-haziri/worker-haziri.component';

export default [
    { path: 'daily-labour', component: DailyLabourComponent },
    { path: 'worker-onboarding', component: WorkerOnboardingComponent},
    { path: 'total-worker-onboarding', component:TotalWorkerOnboardingComponent},
    { path: 'worker-haziri', component: WorkerHaziriComponent},
    { path: 'worker-payment', component: WorkerPaymentComponent},
    { path: '**', redirectTo: '/notfound' }
] as Routes;
