import { Injectable } from '@angular/core';
//1

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';


import { Capacitor } from '@capacitor/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { Storage, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';


@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  //4
  public photos: UserPhoto[] = [];

  image: any;

  constructor(private firestore: Firestore,
    private storage: Storage,
    private toastController: ToastController,
    private loadingCtrl: LoadingController) { }




    async takePicture() {
      try {
        if(Capacitor.getPlatform() != 'web') await Camera.requestPermissions();
        const image = await Camera.getPhoto({
          quality: 90,
          // allowEditing: false,
          source: CameraSource.Prompt,
          width: 600,
          resultType: CameraResultType.DataUrl
        });
        console.log('image: ', image);
        this.image = image.dataUrl;
        await this.showLoading();
        const blob = this.dataURLtoBlob(image.dataUrl);
        const url = await this.uploadImage(blob, image.format);
        console.log(url);
        const response = await this.addDocument('test', { imageUrl: url });
        console.log(response);
        await this.loadingCtrl.dismiss();
        await this.presentToast();
      } catch(e) {
        console.log(e);
        await this.loadingCtrl.dismiss();
      }
    }

  async showLoading() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading...',
      // duration: 3000,
      spinner: 'circles'
    });

    loading.present();
  }

  dataURLtoBlob(dataurl: any) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }


  async uploadImage(blob: any, format: any) {
    try {
      const currentDate = Date.now();
      const filePath = `test/${currentDate}.${format}`;
      const fileRef = ref(this.storage, filePath);
      const task = await uploadBytes(fileRef, blob);
      console.log('task: ', task);
      const url = getDownloadURL(fileRef);
      return url;
    } catch(e) {
      throw(e);
    }    
  }


  addDocument(path: any, data: any) {
    const dataRef = collection(this.firestore, path);
    return addDoc(dataRef, data);
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Image Upload Successfully',
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });

    await toast.present();
  }



}

//3
export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}