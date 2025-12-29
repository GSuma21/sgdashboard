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
          likesCount: (this.story.likesCount ?? 0) + event.diff,
          like: !this.story.like
        }),
        ...(event.action === ACTIONS.SHARE && {
          shareCount: (this.story.shareCount ?? 0) + event.diff
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
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  }

}
