import { Component, OnInit } from '@angular/core';

import { Geolocation } from '@capacitor/geolocation';

import { AndroidSettings, IOSSettings, NativeSettings } from 'capacitor-native-settings';

import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-gps',
  templateUrl: './gps.page.html',
  styleUrls: ['./gps.page.scss'],
})
export class GpsPage implements OnInit {

  latitude: any;
  longitude: any;
  zoom: any=17;
  url: any;

  constructor(private loc: LocationService) {}

  ngOnInit() {
  }


  async getCurrentLocation() {
    try {

      //permisos
      const permissionStatus = await Geolocation.checkPermissions();
      console.log('Permission status: ', permissionStatus.location);
      if(permissionStatus?.location != 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        if(requestStatus.location != 'granted') {
          // go to location settings
          await this.openSettings(true);
          return;
        }
      }






      //localizacion

      let options: PositionOptions = {
        maximumAge: 3000,
        timeout: 10000,
        enableHighAccuracy: true
      };

      const position = await Geolocation.getCurrentPosition(options);
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;
      this.getMap();
      this.loc.addLocation(this.latitude,this.longitude,this.url);
      console.log(position);
    } catch(e: any) {
      if(e?.message == 'Los servicios de localizacion no estan habilitados') {
        await this.openSettings();
      }
      console.log(e);
    }




  }

  openSettings(app = false) {
    console.log('open settings...');
    return NativeSettings.open({
      optionAndroid: app ? AndroidSettings.ApplicationDetails : AndroidSettings.Location, 
      optionIOS: app ? IOSSettings.App : IOSSettings.LocationServices
    });
  }


  getMap(): string{
    this.url = `https://www.google.com/maps/@${this.latitude},${this.longitude},${this.zoom}z?entry=ttu`;
    console.log(this.url);
    return this.url;
  }

  openGoogleMaps() {
    const url = this.getMap();
    window.open(url, '_blank');
  }

}
