import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { VideoService } from 'src/app/services/video.service';

//reproducir

import { Capacitor, Plugins } from '@capacitor/core';
import * as WebVPPlugin from 'capacitor-video-player';

const {CapacitorVideoPlayer} = Plugins;

@Component({
  selector: 'app-video',
  templateUrl: './video.page.html',
  styleUrls: ['./video.page.scss'],
})
export class VideoPage implements AfterViewInit {

  mediaRecorder: MediaRecorder;
  videoPlayer: any;
  isRecording = false;
  videos = [];

  @ViewChild('video') captureElement: ElementRef;

  constructor(private videoService: VideoService, private changeDetector: ChangeDetectorRef) { }


  async ngAfterViewInit(){

      this.videos = await this.videoService.loadVideos();

      //inicializa el plugin del reproductor de video

      if(Capacitor.isNative){
        this.videoPlayer = CapacitorVideoPlayer;
      }else{
        this.videoPlayer = WebVPPlugin.CapacitorVideoPlayer;
      }
  }

  async recordVideo(){

    // Create a stream of video capturing
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user'
      },
      audio: true
    });

    console.log("video",stream)
 
    // Show the stream inside our video object
    this.captureElement.nativeElement.srcObject = stream;
 
    var options = {mimeType: 'video/webm'};
    this.mediaRecorder = new MediaRecorder(stream, options);
    console.log("Media",this.mediaRecorder);
    let chunks = [];
 
    // Store the video on stop
    this.mediaRecorder.onstop = async (event) => {
      const videoBuffer = new Blob(chunks, { type: 'video/webm' });
      await this.videoService.storeVideo(videoBuffer);
      
      // Reload our list
      this.videos = this.videoService.videos;
      this.changeDetector.detectChanges();
    }
 
    // Store chunks of recorded video
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data)
      }
    }
 
    // Start recording wth chunks of data
    this.mediaRecorder.start(100);
    this.isRecording = true;
  
  }

  

  stopRecord(){
    this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.captureElement.nativeElement.srcObject = null;
    this.isRecording = false;
  }

  async playVideo(video){

    const base64data = await this.videoService.getVideoUrl(video);

    
    await this.videoPlayer.initPlayer({
      mode: 'fullscreen',
      url: base64data,
      playerId: 'fullscreen',
      componentTag: 'app-video'
    })

  }




}
