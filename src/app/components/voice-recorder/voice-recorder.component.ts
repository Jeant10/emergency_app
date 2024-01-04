import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { GestureController } from '@ionic/angular';
import { RecordingData, VoiceRecorder } from 'capacitor-voice-recorder';

import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { Storage, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';

//1


@Component({
  selector: 'app-voice-recorder',
  templateUrl: './voice-recorder.component.html',
  styleUrls: ['./voice-recorder.component.scss'],
})

export class VoiceRecorderComponent  implements OnInit, AfterViewInit  {


  recording = false;
  storedFileNames = [];
  durationDisplay = '';
  duration = 0;

  @ViewChild('recordbtn', {read: ElementRef})
  recordbtn: ElementRef;


  constructor(private gestureCtrl : GestureController, private firestore: Firestore,
    private storage: Storage) { }

  ngOnInit() {
    this.loadFiles();
    VoiceRecorder.requestAudioRecordingPermission();
  }

  ngAfterViewInit() {
    const longpress = this.gestureCtrl.create({
      el: this.recordbtn.nativeElement,
      threshold: 0,
      gestureName: 'long-press',
      onStart: ev => {
        Haptics.impact({style: ImpactStyle.Light });
        this.startRecording();
        this.calculateDuration();
      },
      onEnd: ev => {
        Haptics.impact({style: ImpactStyle.Light });
        this.stopRecording();
      }
    }, true);

    longpress.enable();
  }

  calculateDuration () {
    if(!this.recording) {
      
      this.duration = 0;
      this.durationDisplay ='';
      return;
    }

    this.duration += 1;
    const minutes = Math.floor(this.duration / 60);
    const seconds = (this.duration % 60).toString().padStart(2, '0');

    this.durationDisplay = `${minutes}:${seconds}`;


    setTimeout(() => {
      this.calculateDuration();
    }, 1000);
  }

  async loadFiles() {
    Filesystem.readdir({
      path: '',
      directory: Directory.Data
    }).then(result => {
      console.log('Loaded files: ', result);
      this.storedFileNames = result.files;
    });
  }

  startRecording(){
    if(this.recording) {
      return;
  }
  this.recording = true;
  VoiceRecorder.startRecording();
}

  stopRecording() {
    if(!this.recording) {
      return;
    }
    VoiceRecorder.stopRecording().then(async (result: RecordingData) => {
      this.recording = false;
      if(result.value && result.value.recordDataBase64) {
        const recordData = result.value.recordDataBase64;
        console.log(recordData);
        const fileName = new Date().getTime() + '.wav';
        await Filesystem.writeFile({
          path: fileName,
          directory: Directory.Data,
          data: recordData
        });

        //firebase

        //extension del audio
        const mimeType = "audio/aac";
        //para reproducirlo
        const audioRef = new Audio(`data:${mimeType};base64,${recordData}`);

        const blob = this.dataURLtoBlob(audioRef.src);
        const url = await this.uploadImage(blob, 'aac');
        console.log(url);
        const response = await this.addDocument('audio', { imageUrl: url });
        console.log(response);

        this.loadFiles();
      }
    })
  }

  async playFile(filename) {
    const audioFile = await Filesystem.readFile({
      path: filename.name,
      directory: Directory.Data
    });
    const base64Sound = audioFile.data;

    const audioRef = new Audio(`data:audio/aac;base64,${base64Sound}`)
    audioRef.oncanplaythrough = () => audioRef.play();
    audioRef.load;
  }

  async deleteRecording(fileName) {
    await Filesystem.deleteFile({
      directory: Directory.Data,
      path: fileName.name
    });
    this.loadFiles();
  }





























  //firebase

  //esto es como de la foto, en si lo que entendi, es que esto de pasa de una url a un blob, que es para asi subirle al firebasew

  dataURLtoBlob(dataurl: any) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }

  //mejor dicho en donde se va aguardar, conectarse y eso, pero en ese formato blob

  async uploadImage(blob: any, format: any) {
    try {
      const currentDate = Date.now();
      const filePath = `audio/${currentDate}.${format}`;
      const fileRef = ref(this.storage, filePath);
      const task = await uploadBytes(fileRef, blob);
      console.log('task: ', task);
      const url = getDownloadURL(fileRef);
      return url;
    } catch(e) {
      throw(e);
    }    
  }

  //aqui ya le sube
  addDocument(path: any, data: any) {
    const dataRef = collection(this.firestore, path);
    return addDoc(dataRef, data);
  }


}
