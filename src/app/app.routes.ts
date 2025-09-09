import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing';
import { NationalView } from './pages/national-view/national-view';
import { StateView } from './pages/state-view/state-view';
import { DistrictView } from './pages/district-view/district-view';
import { CountryView } from './pages/country-view/country-view';
import { GlobalMap2 } from './pages/global-map-2/global-map-2';
import { CatalysingNetwork1 } from './pages/catalysing-network-1/catalysing-network-1';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { NetworkHealth } from './pages/network-health/network-health';
import { StateImprovementsComponent } from './components/stete-improvements/stete-improvements.component';
import { DistrictImprovementsComponent } from './components/district-improvements/district-improvements.component';
import { CommunityProgramDetailsComponent } from './components/community-program-details/community-program-details.component';
import { LeadersProgramDetailsComponent } from './components/leaders-program-details/leaders-program-details.component';
import { ImprovementDetailsComponent } from './components/improvement-details/improvement-details.component';
import { environment } from '../../environments/environment';
import { COMMUNITY_LED_IMPROVEMENT } from '../constants/urlConstants';
import { ProgramDetails } from './components/program-details/program-details';
import { pageDataConfig } from '../config/pageDataConfig';
import { WorldMapComponent } from './pages/world-map/world-map';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'country-view', component: CountryView },
    { path: 'national-view', component: NationalView },
    { path: 'network-health', component: NetworkHealth },
    { path: 'community-led-improvements', component: ImprovementDetailsComponent},
    { path: 'state-view/:state/:code', component: StateImprovementsComponent, data: pageDataConfig.stateDetails},
  {
    path: 'community-led-district-improvements/:state/:st-code/:district/:dt-code/:extra',
    component: DistrictImprovementsComponent,
    data: {
      filePath: `${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${COMMUNITY_LED_IMPROVEMENT}`,
      ...pageDataConfig.communityDetails
    }
  },
  {
    path: 'community-led-district-improvements/:state/:st-code/:district/:dt-code',
    component: DistrictImprovementsComponent,
    data: {
      filePath: `${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${COMMUNITY_LED_IMPROVEMENT}`,
      ...pageDataConfig.communityDetails
    }
  }
,
    { path: 'state-led-district-improvements/:state/:st-code/:district/:dt-code', component: DistrictImprovementsComponent,data:{...{filePath:`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${COMMUNITY_LED_IMPROVEMENT}`},...pageDataConfig.stateDetails}},
    { path: 'community-program-details', component: CommunityProgramDetailsComponent},
    { path: 'leaders-program-details', component: LeadersProgramDetailsComponent},
    { path: 'district-view/:district', component: DistrictView },
    { path: 'global-map-2', component: GlobalMap2 },
    { path: 'catalysing-network-1', component: CatalysingNetwork1 },
    { path: 'program-details', component: ProgramDetails },
    { path: 'community-view/:state/:code', component: StateImprovementsComponent, data: pageDataConfig.communityDetails },
    { path: 'world-map', component: WorldMapComponent },

];
