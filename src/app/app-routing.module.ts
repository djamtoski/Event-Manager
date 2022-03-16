import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EventsModule } from './events/events.module';

import { HomeComponent } from './home';
import { AuthGuard } from './_helpers';

const accountModule = () => import('./account/account.module').then(x => x.AccountModule);
const eventsModule = () => import('./events/events.module').then(x => x.EventsModule);

const routes: Routes = [
    { path: '', component: HomeComponent, canActivate: [AuthGuard] },
    { path: 'events', loadChildren: eventsModule, canActivate: [AuthGuard] },
    { path: 'account', loadChildren: accountModule }, // no need to add authguard here

    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
