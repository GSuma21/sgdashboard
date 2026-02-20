import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ProgramsReportListComponent } from './programs-report-list.component';

describe('ProgramsReportListComponent', () => {
  let component: ProgramsReportListComponent;
  let fixture: ComponentFixture<ProgramsReportListComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  const routeParams = {
    state: 'karnataka',
    'st-code': 'KA',
    district: 'bengaluru',
    'dt-code': 'BLR'
  };

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    spyOn(window, 'fetch').and.callFake(async () =>
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await TestBed.configureTestingModule({
      imports: [ProgramsReportListComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ params: routeParams } as any)
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramsReportListComponent);
    component = fixture.componentInstance;
    component.programs = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set params data from activated route', () => {
    expect(component.paramsData).toEqual(routeParams);
  });

  it('should open report link in new tab for WLC program', () => {
    const openSpy = spyOn(window, 'open');
    const report = { program_type: 'WLC', report_link: 'https://example.com/wlc' };

    component.openReport(report);

    expect(openSpy).toHaveBeenCalledWith('https://example.com/wlc', '_blank');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to program details for non-WLC program', () => {
    const report = { program_type: 'NON_WLC', report_link: 'https://example.com/report' };

    component.openReport(report);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/program-details'], { state: { report } });
  });

  it('should navigate to community details path', () => {
    component.openCommunityDetails();

    expect(routerSpy.navigate).toHaveBeenCalledWith([
      '/community-led-district-improvements',
      'karnataka',
      'KA',
      'bengaluru',
      'BLR',
      'dashboard'
    ]);
  });

  it('should filter partner details based on program partner names', () => {
    component.partners = [
      {
        type: 'partner-logos',
        partners: [
          { name: 'Partner A', src: 'a.png' },
          { name: 'Partner B', src: 'b.png' },
          { name: 'Partner C', src: 'c.png' }
        ]
      }
    ];
    const programData = {
      name_of_the_partner_leading_the_program: 'Partner A, Partner C'
    };

    const result = component.getPartnerDetails(programData);

    expect(result.length).toBe(2);
    expect(result.map((p: any) => p.name)).toEqual(['Partner A', 'Partner C']);
  });

  it('should return empty partner details when no partner logos entry exists', () => {
    component.partners = [{ type: 'other' }];
    const programData = {
      name_of_the_partner_leading_the_program: 'Partner A'
    };

    const result = component.getPartnerDetails(programData);

    expect(result).toEqual([]);
  });

  it('should call getPartnersList on init', () => {
    const getPartnersListSpy = spyOn(component, 'getPartnersList');

    component.ngOnInit();

    expect(getPartnersListSpy).toHaveBeenCalled();
  });

  it('should not scroll right when carousel is missing', () => {
    const event = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      currentTarget: document.createElement('button')
    } as unknown as MouseEvent;

    component.scrollRight(event);

    expect((event.stopPropagation as jasmine.Spy)).toHaveBeenCalled();
  });

  it('should not scroll left when container is missing', () => {
    const button = document.createElement('button');
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    carousel.appendChild(button);

    const event = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      currentTarget: button
    } as unknown as MouseEvent;

    component.scrollLeft(event);

    expect((event.stopPropagation as jasmine.Spy)).toHaveBeenCalled();
  });

  it('should scroll right and clamp to max scroll', () => {
    const button = document.createElement('button');
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    const track = document.createElement('div');
    track.className = 'carousel-track';
    carousel.appendChild(track);
    carousel.appendChild(button);

    Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(track, 'scrollWidth', { value: 500, configurable: true });
    Object.defineProperty(track, 'scrollLeft', { value: 250, writable: true, configurable: true });
    const scrollToSpy = spyOn(track, 'scrollTo');

    const event = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      currentTarget: button
    } as unknown as MouseEvent;

    component.scrollRight(event);

    expect(scrollToSpy).toHaveBeenCalled();
    const options = scrollToSpy.calls.mostRecent().args[0] as ScrollToOptions;
    expect(options.left).toBe(200);
    expect(options.behavior).toBe('smooth');
  });

  it('should scroll left and clamp to zero', () => {
    const button = document.createElement('button');
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    const track = document.createElement('div');
    track.className = 'carousel-track';
    carousel.appendChild(track);
    carousel.appendChild(button);

    Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(track, 'scrollLeft', { value: 100, writable: true, configurable: true });
    const scrollToSpy = spyOn(track, 'scrollTo');

    const event = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      currentTarget: button
    } as unknown as MouseEvent;

    component.scrollLeft(event);

    expect(scrollToSpy).toHaveBeenCalled();
    const options = scrollToSpy.calls.mostRecent().args[0] as ScrollToOptions;
    expect(options.left).toBe(0);
    expect(options.behavior).toBe('smooth');
  });
});
