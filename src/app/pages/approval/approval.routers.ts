import { Routes } from "@angular/router";
import { MyApprovalComponent } from "./my-approval/my-approval.component";

export default[
{path:'my-approval',component:MyApprovalComponent},
 { path: '**', redirectTo: '/notfound' }
] as Routes;