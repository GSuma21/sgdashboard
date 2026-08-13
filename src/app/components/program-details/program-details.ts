import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../../../environments/environment';
import * as d3 from 'd3';
import { LANDING_PAGE } from '../../../constants/urlConstants';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { LoaderRunnerService } from '../../services/loader-runner.service';
import { MatDialog } from '@angular/material/dialog';
import { OutcomesModelComponent } from '../outcomes-model/outcomes-model.component';
import { SAMPLE_PROGRAM_OUTCOME_DATA } from '../outcomes-model/outcomes-model.config';

@Component({
  selector: 'app-program-details',
  imports: [CommonModule, RouterModule,MatIcon, OutcomesModelComponent],
  templateUrl: './program-details.html',
  styleUrl: './program-details.css'
})
export class ProgramDetails {
  programData :any
  baseUrl: any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`
  colors = [
  'var(--secondary-color-light)',
  'var(--primary-color-light)',
  'var(--tertiary-color-light)'
];

  programData1: any = SAMPLE_PROGRAM_OUTCOME_DATA;


  @ViewChild('galleryTrack') galleryTrack!: ElementRef;
  @ViewChild('downloadDialog') downloadDialog!: TemplateRef<any>;

  constructor(private location: Location,private router: Router, private loaderRunner: LoaderRunnerService, public dialog: MatDialog) {
    this.onResize();
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { report: any };
    this.programData = state?.report;  
  }
  currentSlide = 0;
  public displayImages: string[] = [];
  private transitionEndListener: any;
  visibleSlides = 4; // how many images visible at once
  partnerDetails: any

  @HostListener('window:resize', ['$event'])
  onResize(event?: any) {
    const width = window.innerWidth;
    if (width < 576) {
      this.visibleSlides = 1;
    } else if (width < 768) {
      this.visibleSlides = 2;
    } else if (width < 992) {
      this.visibleSlides = 2;
    } else if (width < 1200) {
      this.visibleSlides = 3;
    } else {
      this.visibleSlides = 4;
    }
    this.updateSlidePosition(false); // Update position without animation on resize
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    window.scrollTo(0,0)
    this.displayImages = this.programData.logo_urls || [];
    this.getPartnerDetails()
  }

 async getPartnerDetails() {
    await this.loaderRunner.run(async () => {

    return d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${LANDING_PAGE}`).then((data: any) => {
      this.partnerDetails = data;
      const partners = data.find((item: { type: string; }) => item.type === "partner-logos")?.partners || [];
      this.partnerDetails = partners.filter((p: { name: string; }) =>
        this.programData.name_of_the_partner_leading_the_program.includes(p.name)
      );
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  });


  }


  openReport(report:any) {
    window.open(report?.report_link,'_blank')
  }  


  nextSlide(): void {
    if (this.currentSlide < this.programData.logo_urls.length - this.visibleSlides) {
      this.currentSlide++;
    } else {
      this.currentSlide = 0; // loop back
    }
    this.updateSlidePosition();
  }

  prevSlide(): void {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    } else {
      this.currentSlide = this.programData.logo_urls.length - this.visibleSlides;
    }
    this.updateSlidePosition();
  }

  updateSlidePosition(animate = true): void {
  if (this.galleryTrack) {
    const track = this.galleryTrack.nativeElement;
    track.style.transition = animate ? 'transform 0.5s ease-in-out' : 'none';
    const slideWidth = 100 / this.visibleSlides;
    track.style.transform = `translateX(-${this.currentSlide * slideWidth}%)`;
  }
}


  goBack(): void {
    this.location.back(); // navigates to the previous page
  }

  get impactText(): string {
  if (!this.programData?.impact_of_the_program) return '';

  return this.programData.impact_of_the_program
    .replace(/^\d+\.\s*/gm, '• '); 
}

  get impactCardList(): string[] {
    const text = this.programData?.learn_how_micro_improvements_are_contributing_to_mega_impact__impact_achieved;
    if (!text) return [];

    return text
      .split('\n')
      .map((item: string) =>
        item.replace(/^[\s•\-–—]*\d*[\.\)]?\s*/, '').trim()
      )
      .filter((item: string) => item.length > 0);
  }

  openLink(link: string) {
    window.open(link, '_blank');
  }

  OnClickMultipleReports(programData: any) {
    const links = this.getClickReportLinks(programData.download_to_read_more);

    this.dialog.open(this.downloadDialog, {
      width: '500px',
      data: {
        programName: programData.name_of_the_program,
        links: links
      }
    });
  }

  getClickReportLinks(value: any): string[] {
    if (!value) return [];

    // If already array → clean and return
    if (Array.isArray(value)) {
      return value.map(v => String(v).trim()).filter(v => v);
    }

    // Convert to string
    const text = String(value);

    return text
      .split(/\n|,/) // split by newline OR comma
      .map(item =>
        item
          .replace(/^[\s•\-–—]*\d*[\.\)]?\s*/, '') // remove bullets, numbers
          .trim()
      )
      .filter(item => item.length > 0);
  }

}
