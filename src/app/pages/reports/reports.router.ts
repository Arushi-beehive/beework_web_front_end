import { Routes } from '@angular/router';
import { DailyLabourComponent } from './daily-labour/daily-labour.component';
import { WorkerOnboardingComponent } from './worker-onboarding/worker-onboarding.component';
import { WorkerWagesComponent } from './worker-wages/worker-wages.component';
import { WorkerPaymentComponent } from './worker-payment/worker-payment.component';
import { TotalWorkerOnboardingComponent } from './attendance-in-out/total-worker-onboarding.component';
import { ExpenseReportComponent } from './expense-report/expense-report.component';

export default [
    { path: 'daily-labour', component: DailyLabourComponent },
    { path: 'worker-onboarding', component: WorkerOnboardingComponent},
    { path: 'total-worker-onboarding', component:TotalWorkerOnboardingComponent},
    { path: 'worker-wages', component: WorkerWagesComponent},
    { path: 'worker-payment', component: WorkerPaymentComponent},
    { path: 'expense-report', component: ExpenseReportComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
