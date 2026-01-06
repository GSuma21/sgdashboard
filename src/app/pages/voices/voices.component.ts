import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { environment } from '../../../../environments/environment';
import { VOICES_PAGE } from '../../../constants/urlConstants';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
import { MatDialog } from '@angular/material/dialog';
import { StoryModel } from '../../components/story-model/story-model';
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

  constructor(private router:ActivatedRoute,private dialog: MatDialog,private utils:UtilsService, private sg:firebaseService) {
  }

  async ngOnInit() {
    d3.json(`${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${STORY_OF_THE_WEEK}`).then(async (data: any) => {
      const currentWeek:number = this.getWeekNumber(new Date());
      this.story = data.data.length < currentWeek ? data["data"][data.data.length - 2] : data["data"][currentWeek - 1]  || data["data"][0]; // Fallback to 0 if out of bounds
      this.router.queryParams.subscribe((res:any) => {
        console.log(currentWeek)
        if(res.storyId) {
          const dialogRef = this.dialog.open(StoryModel, {
            width: '900px',
            panelClass: 'story-dialog',
            autoFocus: false,
            data: data.data.find((story:any) => {
              story.id == res.storyId
              return story;
            }),
          });

          dialogRef.afterClosed().subscribe(result => {

            if (!result) return;
            // this.storyAction.emit(result);
          });
        }
      })
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
      this.story = event.status ? {
        ...this.story,
        ...(event.action === ACTIONS.LIKE && {
          likesCount: (this.story.likesCount ?? 0) + event.diff,
          like: !this.story.like
        }),
        ...(event.action === ACTIONS.SHARE && {
          shareCount: (this.story.shareCount ?? 0) + event.diff
        })
      }: event;
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

  getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }

}
