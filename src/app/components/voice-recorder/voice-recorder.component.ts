import { Component, OnInit } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';



import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { Storage, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';

//1

// only 'VoiceRecorder' is mandatory, the rest is for typing
import { VoiceRecorder, VoiceRecorderPlugin, RecordingData, GenericResponse, CurrentRecordingStatus } from 'capacitor-voice-recorder';

@Component({
  selector: 'app-voice-recorder',
  templateUrl: './voice-recorder.component.html',
  styleUrls: ['./voice-recorder.component.scss'],
})
export class VoiceRecorderComponent  implements OnInit {


  isRecording: boolean = false;
  isPlay: boolean;
  fileName:string = "";
  storedFileNames:any = [];

  constructor(private firestore: Firestore,
    private storage: Storage,) { }

  ngOnInit(
  ) 
  {

    this.loadFiles();

    VoiceRecorder.hasAudioRecordingPermission().then(result=>{
      if(!result.value){
        VoiceRecorder.requestAudioRecordingPermission();
      }
    })

    this.fileName = new Date().getTime() + '.wav';

    
  }

  recorder(){

    if(this.isRecording){
      return;
    }
    this.isRecording = true;
    VoiceRecorder.startRecording();
  }

  stop(){
    if(!this.isRecording){
      return;
    }
    VoiceRecorder.stopRecording().then(async (result: RecordingData)=>{
      if(result.value){
        //en base64
        const recordData = result.value.recordDataBase64;

        console.log(recordData);

        //Guardar el audio en filesystem, no en firebase
        
        //guardo el audio
        await Filesystem.writeFile({
          //nombre del archivo
          path: this.fileName,
          directory: Directory.Data,
          data: recordData
        });

            //extension del audio
        const mimeType = "audio/aac";
    //para reproducirlo
        const audioRef = new Audio(`data:${mimeType};base64,${recordData}`);

        const blob = this.dataURLtoBlob(audioRef.src);
        const url = await this.uploadImage(blob, 'aac');
        console.log(url);
        const response = await this.addDocument('test', { imageUrl: url });
        console.log(response);

        this.loadFiles();
        
      }
    });

  }


  async play(fileName){
    //obtengo el audio en base64?
    const audio = await Filesystem.readFile({
      //nombre del archivo
      path: fileName.name,
      directory: Directory.Data,
    });

    const base64Sound = audio.data;

    if(!base64Sound){
      return;
    }

    this.isPlay = true;
    //extension del audio
    const mimeType = "audio/aac";
    //para reproducirlo
    const audioRef = new Audio(`data:${mimeType};base64,${base64Sound}`);
    console.log(audioRef.src);
    audioRef.oncanplaythrough = () => audioRef.play();
    audioRef.load();

  }


  //aqui es para ver los archivos de audio que grabo

  async loadFiles(){
    Filesystem.readdir({
      path:'',
      directory:Directory.Data
    }).then(result => {
      console.log(result)
      this.storedFileNames = result.files;
    });
  }


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
