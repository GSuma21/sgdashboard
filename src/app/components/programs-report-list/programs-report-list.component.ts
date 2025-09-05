import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import * as d3 from 'd3';
import { LANDING_PAGE } from '../../../constants/urlConstants';

@Component({
  selector: 'app-programs-report-list',
  standalone: true,
  imports: [CommonModule,MatCardModule],
  templateUrl: './programs-report-list.component.html',
  styleUrl: './programs-report-list.component.css'
})
export class ProgramsReportListComponent implements OnInit {

  @Input() headerText:string = 'Programs List';
  @Input() CommunityButton:boolean = false;
  @Input() pageConfig:any;
  paramsData:any

  partners:any = [];
  constructor(private router:Router, private activatedRoute: ActivatedRoute) {
    this.activatedRoute.paramMap.subscribe((param:any) => {
      this.paramsData = param.params
    });
  }

  @Input() programs:any = []

  scrollLeft(event: any) {
    event.stopPropagation(); //Prevent a parent element’s event handler from firing
    const container = (event.target as HTMLElement).parentElement!.querySelector('.carousel-track');
    container!.scrollBy({ left: -300, behavior: 'smooth' });
  }

  ngOnInit(): void {
    this.getPartnersList();
  }

  openReport(report:any) {
    if(report.report_link) {
      window.open(report.report_link,'_blank')
    }
    else {
      this.router.navigate(['/program-details'], { state: { report } });
    }
  }

  scrollRight(event: any) {
    event.stopPropagation();
    const container = (event.target as HTMLElement).parentElement!.querySelector('.carousel-track');
    container!.scrollBy({ left: 300, behavior: 'smooth' });
  }

  openCommunityDetails() {
    let pathData = this.paramsData
    this.router.navigate(['/community-led-district-improvements', pathData.state, pathData["st-code"], pathData.district, pathData["dt-code"]]);
  }


  getPartnerDetails(programData:any) {
    let partnerDetails:any = [];
    const partners = this.partners.find((item: { type: string; }) => item.type === "partner-logos")?.partners || [];
    partnerDetails = partners.filter((p: { name: string; }) =>
      programData.name_of_the_partner_leading_the_program.includes(p.name)
    );
    return partnerDetails;
  }

  getPartnersList() {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${LANDING_PAGE}`).then((data: any) => {
      this.partners = data;
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

}
