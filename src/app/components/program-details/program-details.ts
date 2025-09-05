import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../../../environments/environment';
import * as d3 from 'd3';
import { LANDING_PAGE } from '../../../constants/urlConstants';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-program-details',
  imports: [CommonModule, RouterModule],
  templateUrl: './program-details.html',
  styleUrl: './program-details.css'
})
export class ProgramDetails {
  programData :any
  baseUrl: any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`


  @ViewChild('galleryTrack') galleryTrack!: ElementRef;

  constructor(private location: Location,private router: Router) {
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
    console.log(this.programData)
    this.displayImages = this.programData.logo_urls || [];
    this.getPartnerDetails()
  }

  getPartnerDetails() {

    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${LANDING_PAGE}`).then((data: any) => {
      this.partnerDetails = data;
      const partners = data.find((item: { type: string; }) => item.type === "partner-logos")?.partners || [];
      this.partnerDetails = partners.filter((p: { name: string; }) =>
        this.programData.name_of_the_partner_leading_the_program.includes(p.name)
      );
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });

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
    // Replace "1." "2." etc. with "•"
    return this.programData.impact_of_the_program.replace(/\d+\./g, '•');
  }

}
