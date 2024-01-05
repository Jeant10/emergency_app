import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  constructor(private afs: AngularFirestore) { }

  addLocation(latitud: any=0, longitud: any=0, url:any =0) {
    return this.afs.collection('locations').add({
      latitud: latitud,
      longitud: longitud,
      url: url
    });
  }

  

}
