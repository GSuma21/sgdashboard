import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { environment } from '../../../../environments/environment';
import { VOICES_PAGE } from '../../../constants/urlConstants';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IndicatorCardComponent } from '../../components/indicator-card/indicator-card';
import { StoriesCarouselComponent } from '../../components/stories-carousel/stories-carousel.component';
import { ImprovementStoryComponent } from '../../components/improvement-story/improvement-story.component';
import { HeatMapComponent } from '../../components/heat-map/heat-map.component';
import { MultiAxisChartComponent } from '../../components/multi-axis-chart/multi-axis-chart.component';
import { LineChartComponent } from '../../components/line-chart/line-chart';
import { VerticalCarouselComponent } from '../../components/vertical-carousel/vertical-carousel.component';
import { UtilsService } from '../../services/utils.services';
import { firebaseService } from '../../../firebase/firestore-service';
import { VoicesAnimationsComponent } from '../../components/voices-animations/voices-animations.component';
import { STORY_OF_THE_WEEK  } from '../../../constants/urlConstants';
import { ACTIONS } from '../../../constants/actionConstants';
// import { VoicesAnimationsComponent } from '../../components/voices-animations/voices-animations.component';

@Component({
  selector: 'app-voices',
  standalone:true,
  imports: [CommonModule, RouterModule, IndicatorCardComponent,StoriesCarouselComponent, ImprovementStoryComponent,HeatMapComponent,MultiAxisChartComponent, LineChartComponent, VerticalCarouselComponent, VoicesAnimationsComponent],
  templateUrl: './voices.component.html',
  styleUrls: ['./voices.component.scss']
})

export class VoicesComponent implements OnInit {


  pageData: any = [];
  window: any = window;
  browserId:string='';

  heatmapThemes: any = [
    { id: '1', title: 'Child Marriage', count: 24, color: 'purple', gridClass: 'span-2-2', icon: 'https://storage.googleapis.com/dev-sg-dashboard/sg-dashboard/assets/icons/poverty_and_economic_barriers.svg' },
    { id: '2', title: 'Village Education', count: 21, color: 'light-purple', gridClass: 'span-2-2', icon: 'https://storage.googleapis.com/dev-sg-dashboard/sg-dashboard/assets/icons/legal_document_linked_barriers.svg' },
    { id: '3', title: 'School is far from village', count: 13, color: 'brown', gridClass: 'span-1-2', icon: 'https://storage.googleapis.com/dev-sg-dashboard/sg-dashboard/assets/icons/early_marriage.svg' },
    { id: '4', title: 'Infrastructure', count: 21, color: 'brown-light', gridClass: 'span-2-2', icon: 'https://storage.googleapis.com/dev-sg-dashboard/sg-dashboard/assets/icons/distance_and_accessibility_issues.svg' },
    { id: '5', title: 'Water and sanitation', count: 8, color: 'pink', gridClass: 'span-2-1', icon: 'https://storage.googleapis.com/dev-sg-dashboard/sg-dashboard/assets/icons/parental_attitudes_and_socio-cultural_barriers.svg' },
    { id: '6', title: 'Documents missing', count: 8, color: 'green', gridClass: 'span-1-1', icon: 'https://storage.googleapis.com/dev-sg-dashboard/sg-dashboard/assets/icons/school_infrastructure.svg' },
    { id: '8', title: 'Financial Constraints', count: 8, color: 'orange', gridClass: 'span-2-1', icon: 'https://storage.googleapis.com/dev-sg-dashboard/sg-dashboard/assets/icons/teacher_capacity_and__quality_issues.svg' },
    { id: '9', title: 'Teacher Attendance', count: 8, color: 'beige', gridClass: 'span-1-1', icon: 'https://storage.googleapis.com/dev-sg-dashboard/sg-dashboard/assets/icons/safety_concerns.svg' }
  ];

  heatmapVoices:any = [
    // Child Marriage Voices (Purple)
    { id: 'v1', text: 'Due to social pressure, girls are married at an early age or put to work as domestic servants, which hampers their education', author: 'Parent, Bihar', themeId: '1', color: 'purple' },
    { id: 'v2', text: 'Girls are considered a burden and are married off without completing their education', author: 'Mother, Bihar', themeId: '1', color: 'purple' },
    { id: 'v3', text: 'If you marry at an older age, you will have to give dowry and the girl will become a burden in the house', author: 'Teacher, Bihar', themeId: '1', color: 'purple' },
    { id: 'v4', text: 'There is less emphasis on higher education for girls and many girls are encouraged to get married after passing the 12th grade', author: 'Mother, Bihar', themeId: '1', color: 'purple' },

    // Village Education Voices (Light Purple)
    { id: 'v5', text: 'The school in our village has no teachers.', author: 'Student', themeId: '2', color: 'light-purple' },
    { id: 'v6', text: 'We want to study but there are no facilities.', author: 'Student', themeId: '2', color: 'light-purple' },

    // Infrastructure Voices (Blue)
    { id: 'v7', text: 'The road to school is broken and dangerous.', author: 'Parent', themeId: '4', color: 'brown-light' },
    { id: 'v8', text: 'We need better classrooms.', author: 'Teacher', themeId: '4', color: 'brown-light' }
  ];

  story:any=[];
  isMobile = window.innerWidth <= 768;


  constructor(private utils:UtilsService, private sg:firebaseService) { }
  async ngOnInit() {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${STORY_OF_THE_WEEK}`).then(async (data: any) => {
      this.story= data["data"][0];
      try {
        this.browserId = this.utils.getBrowserId();

        const storyIds = [this.story.id]

        if (!storyIds.length) {
          this.fetchPageData();
          return;
        }

        const counts= await this.sg.getStoryCountsBulk(storyIds,this.browserId);

        this.story = {
          ...this.story,
          ...counts[0] 
        };

        console.log('slides--2',this.story)

      } catch (error) {
        console.error('Failed to load story counts:', error);

        // this.story = this.story.map((item:any) => ({
        //   ...item,
        //   likesCount: item.likesCount ?? 0,
        //   shareCount: item.shareCount ?? 0,
        //   downloadCount: item.downloadCount ?? 0
        // }));

      } finally {
        this.fetchPageData();
      }
     }).catch((error: any) => {
        console.error('Error loading page data:', error);
    });
  }



  onStoryAction(event: any) {
      this.story = {
        ...this.story,
        ...(event.action === ACTIONS.LIKE && {
          likesCount: this.story.likesCount + event.diff,
          like: !this.story.like
        }),
        ...(event.action === ACTIONS.SHARE && {
          shareCount: this.story.shareCount + event.diff
        })
      };
  }

  fetchPageData(): void {
    // d3.json(`./assets/voices.json`).then((data: any) => {
    //   this.pageData = data;
    //   console.log(data)
    // }).catch((error: any) => {
    //   console.error('Error loading page data:', error);
    // });
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${VOICES_PAGE}`).then((data: any) => {
      this.pageData = data;
      console.log(data)
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

}
