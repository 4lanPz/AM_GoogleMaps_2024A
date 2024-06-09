import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GmapsService {
  private googleMaps: any;

  constructor() {}

  loadGoogleMaps(): Promise<any> {
    const win = window as any;
    const gModule = win.google;
    if (gModule && gModule.maps) {
      return Promise.resolve(gModule.maps);
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src =
        'https://maps.googleapis.com/maps/api/js?key=' +
        environment.googleMapsApiKey;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const loadedGoogleModule = win.google;
        if (loadedGoogleModule && loadedGoogleModule.maps) {
          this.googleMaps = loadedGoogleModule.maps;
          resolve(loadedGoogleModule.maps);
        } else {
          reject('Google Map SDK is not Available');
        }
      };
      document.body.appendChild(script);
    });
  }

  getGoogleMaps(): any {
    return this.googleMaps;
  }

  async reverseGeocodeLatLng(latLng: { lat: number; lng: number }): Promise<string> {
    const googleMaps = await this.loadGoogleMaps();
    const geocoder = new googleMaps.Geocoder();
    return new Promise<string>((resolve, reject) => {
      geocoder.geocode({ location: latLng }, (results: any[], status: string) => {
        if (status === googleMaps.GeocoderStatus.OK) {
          if (results[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject('No results found');
          }
        } else {
          reject('Geocoder failed due to: ' + status);
        }
      });
    });
  }
}
