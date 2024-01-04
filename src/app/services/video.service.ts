import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { Storage as Str, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  public videos = []; //private
  private VIDEOS_KEY: string = 'videos';

  constructor(private firestore: Firestore,
    private storage: Str) { }

  async loadVideos(){
    const videoList = await Storage.get({key: this.VIDEOS_KEY}); //?
    this.videos = JSON.parse(videoList.value) || [];
    return this.videos;
  }

  async storeVideo(blob){

    const fileName = new Date().getTime() + '.mp4';
    const base64Data = await this.convertBlobToBase64(blob) as string;

    //firebase
    const url = await this.uploadImage(blob, 'webm');
    console.log(url);
    const response = await this.addDocument('video', { imageUrl: url });
    console.log(response);


    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    console.log(savedFile)

    this.videos.unshift(savedFile.uri);
    console.log('my array now', this.videos);

    return Storage.set({
      key: this.VIDEOS_KEY,
      value: JSON.stringify(this.videos)
    });

  }

  private convertBlobToBase64 = (blob:Blob) => new Promise((resolve,reject)=>{
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  async getVideoUrl(fullPath){
    const path = fullPath.substr(fullPath.lastIndexOf('/') + 1);
    const file = await Filesystem.readFile({
      path: path, //12334.mp4
      directory: Directory.Data //DATA/... 
    });

    console.log("mi path", file);
    return `data:video/mp4;base64,${file.data}`;
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
      const filePath = `video/${currentDate}.${format}`;
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
