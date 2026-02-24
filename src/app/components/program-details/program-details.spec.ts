import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter, Router } from '@angular/router';
import { LoaderRunnerService } from '../../services/loader-runner.service';

import { ProgramDetails } from './program-details';

describe('ProgramDetails', () => {
  let component: ProgramDetails;
  let fixture: ComponentFixture<ProgramDetails>;
  let locationSpy: jasmine.SpyObj<Location>;
  let loaderRunnerSpy: jasmine.SpyObj<LoaderRunnerService>;

  const mockProgramData = {
    state_name: 'Karnataka',
    district_name: 'Bengaluru',
    name_of_the_program: 'Program A',
    report_link: 'https://example.com/report',
    logo_urls: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg'],
    about_the_program_objective: 'Objective',
    impact_of_the_program: '1.First impact 2.Second impact',
    stakeholders_doing_the_program: 'Teachers',
    name_of_the_partner_leading_the_program: 'Partner One, Partner Two'
  };

  const partnerData = [
    {
      type: 'partner-logos',
      partners: [
        { name: 'Partner One', src: 'one.png', alt: 'one', website: 'https://one.com' },
        { name: 'Partner Two', src: 'two.png', alt: 'two', website: 'https://two.com' },
        { name: 'Partner Three', src: 'three.png', alt: 'three', website: 'https://three.com' }
      ]
    }
  ];

  beforeEach(async () => {
    locationSpy = jasmine.createSpyObj('Location', ['back']);
    loaderRunnerSpy = jasmine.createSpyObj('LoaderRunnerService', ['run']);

    loaderRunnerSpy.run.and.callFake(async (work: () => Promise<any>) => work());
    spyOn(window, 'fetch').and.callFake(async () =>
      new Response(JSON.stringify(partnerData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    spyOn(window, 'scrollTo');

    await TestBed.configureTestingModule({
      imports: [ProgramDetails],
      providers: [
        provideRouter([]),
        { provide: Location, useValue: locationSpy },
        { provide: LoaderRunnerService, useValue: loaderRunnerSpy }
      ]
    })
    .compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'getCurrentNavigation').and.returnValue({
      extras: {
        state: { report: mockProgramData }
      }
    } as any);

    fixture = TestBed.createComponent(ProgramDetails);
    component = fixture.componentInstance;
    component.partnerDetails = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize program data from navigation state', () => {
    expect(component.programData).toEqual(mockProgramData);
  });

  it('should set display images and load partners on init', async () => {
    await component.getPartnerDetails();
    expect(component.displayImages).toEqual(mockProgramData.logo_urls);
    expect(loaderRunnerSpy.run).toHaveBeenCalled();
    expect(window.fetch).toHaveBeenCalled();
    expect(component.partnerDetails.length).toBe(2);
  });

  it('should handle partner details fetch error', async () => {
    const errorSpy = spyOn(console, 'error');
    (window.fetch as jasmine.Spy).and.returnValue(Promise.reject(new Error('failed')));

    await component.getPartnerDetails();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('should open report in new tab', () => {
    const openSpy = spyOn(window, 'open');

    component.openReport({ report_link: 'https://example.com/r' });

    expect(openSpy).toHaveBeenCalledWith('https://example.com/r', '_blank');
  });

  it('should move to next slide and loop to first slide', () => {
    component.visibleSlides = 4;
    component.currentSlide = 0;
    spyOn(component, 'updateSlidePosition');

    component.nextSlide();
    expect(component.currentSlide).toBe(1);

    component.nextSlide();
    expect(component.currentSlide).toBe(0);
    expect(component.updateSlidePosition).toHaveBeenCalledTimes(2);
  });

  it('should move to previous slide and wrap around', () => {
    component.visibleSlides = 4;
    component.currentSlide = 1;
    spyOn(component, 'updateSlidePosition');

    component.prevSlide();
    expect(component.currentSlide).toBe(0);

    component.prevSlide();
    expect(component.currentSlide).toBe(1);
    expect(component.updateSlidePosition).toHaveBeenCalledTimes(2);
  });

  it('should update slide position with animation', () => {
    const mockTrack = { style: { transition: '', transform: '' } };
    (component as any).galleryTrack = { nativeElement: mockTrack };
    component.currentSlide = 2;
    component.visibleSlides = 4;

    component.updateSlidePosition(true);

    expect(mockTrack.style.transition).toBe('transform 0.5s ease-in-out');
    expect(mockTrack.style.transform).toBe('translateX(-50%)');
  });

  it('should update slide position without animation', () => {
    const mockTrack = { style: { transition: '', transform: '' } };
    (component as any).galleryTrack = { nativeElement: mockTrack };
    component.currentSlide = 1;
    component.visibleSlides = 2;

    component.updateSlidePosition(false);

    expect(mockTrack.style.transition).toBe('none');
    expect(mockTrack.style.transform).toBe('translateX(-50%)');
  });

  it('should handle resize breakpoints', () => {
    spyOn(component, 'updateSlidePosition');
    const innerWidthSpy = spyOnProperty(window, 'innerWidth', 'get');

    innerWidthSpy.and.returnValue(500);
    component.onResize();
    expect(component.visibleSlides).toBe(1);

    innerWidthSpy.and.returnValue(700);
    component.onResize();
    expect(component.visibleSlides).toBe(2);

    innerWidthSpy.and.returnValue(900);
    component.onResize();
    expect(component.visibleSlides).toBe(2);

    innerWidthSpy.and.returnValue(1100);
    component.onResize();
    expect(component.visibleSlides).toBe(3);

    innerWidthSpy.and.returnValue(1300);
    component.onResize();
    expect(component.visibleSlides).toBe(4);
  });

  it('should go back to previous page', () => {
    component.goBack();
    expect(locationSpy.back).toHaveBeenCalled();
  });

  it('should return formatted impact text', () => {
    expect(component.impactText).toContain('•');
    expect(component.impactText).not.toContain('1.');
  });

  it('should return empty impact text when no data', () => {
    component.programData = {};
    expect(component.impactText).toBe('');
  });
});
