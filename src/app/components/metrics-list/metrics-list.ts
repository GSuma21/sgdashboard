import { Component, Input, Output,EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { environment } from '../../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-metrics-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metrics-list.html',
  styleUrls: ['./metrics-list.css']
})
export class MetricsListComponent {
  @Input() data: any;
  @Input() path: any;
  @Input() replaceCode?: any
  @Output() scrollToProgramsEvent = new EventEmitter<void>();
  dataFetchPath:any
  baseUrl:any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`
  finalData:any = []
  @Output() metricsEvent = new EventEmitter<any>();
  paramsData:any

  constructor(private activatedRoute: ActivatedRoute, private router: Router){
    this.activatedRoute.paramMap.subscribe((param:any) => {
      this.paramsData = param.params
    });
  }

  ngOnInit(){
    this.dataFetchPath = this.replaceCode ? this.path.replace('{code}', this.replaceCode.toString()) : this.path
    this.fetchData()
  }

  fetchData(){
    d3.json(`${this.baseUrl}${this.dataFetchPath}`).then((data:any)=>{
      this.metricsEvent.emit(data.metrics)
      this.updateData(data.metrics)
    }).catch((err:any)=>{
      console.error("Error loading pie-chart data ",err)
    })
  }

  updateData(fetchedData: any){
    this.finalData = this.data.map((item: any) => {
      const matchedData = fetchedData.find((v: any) => v.identifier === item.identifier);
      return {
        ...item,
        value: matchedData ? matchedData.value : 0
      };
    });
  }

  navigateToLocation(item:any) {
    console.log(item);
    if(item.value == 0) return
    if(item.identifier == 'slm'){
      this.scrollToProgramsEvent.emit();
      return;
    }else if(item.identifier == 'clm'){
      this.router.navigate(['/community-view', this.paramsData.state, this.paramsData.code ]);
      return
    }
    window.scrollBy({
      top: 300,
      left: 0,
      behavior: 'smooth'
    });
  }
}
