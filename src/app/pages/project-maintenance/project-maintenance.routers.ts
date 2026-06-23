import { Routes } from '@angular/router';
import { RuleDetailComponent } from './rule-detail/rule-detail.component';
import { ProjectComponent } from './project/project.component';
import { TowerComponent } from './tower/tower.component';

export default [
     {path:'rule-detail',component:RuleDetailComponent},
     {path:'project',component:ProjectComponent},
     {path:'tower',component:TowerComponent},
     { path: '**', redirectTo: '/notfound' }
] as Routes;
