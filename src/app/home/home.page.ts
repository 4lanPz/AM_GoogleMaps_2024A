import { GmapsService } from './../services/gmaps/gmaps.service';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})


export class HomePage implements OnInit, OnDestroy {
  locationInfo: string = ''; // Inicialmente vacío
  @ViewChild('map', { static: true }) mapElementRef: ElementRef | undefined;
  googleMaps: any;
  center = { lat: -0.180653, lng: -78.467834 };
  map: any;
  mapClickListener: any;
  markerClickListener: any;
  markers: any[] = [];

  constructor(
    private gmaps: GmapsService,
    private renderer: Renderer2,
    private actionSheetCtrl: ActionSheetController,
    private changeDetectorRef: ChangeDetectorRef // Agregar esta línea
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.loadMap();
  }

  async loadMap() {
    try {
      let googleMaps: any = await this.gmaps.loadGoogleMaps();
      this.googleMaps = googleMaps;
      if (this.mapElementRef) {
        const mapEl = this.mapElementRef.nativeElement;
        const location = new googleMaps.LatLng(
          this.center.lat,
          this.center.lng
        );
        this.map = new googleMaps.Map(mapEl, {
          center: location,
          zoom: 12,
        });
        this.renderer.addClass(mapEl, 'visible');
        this.onMapClick();
      } else {
        console.log('mapElementRef is undefined');
      }
    } catch (e) {
      console.log(e);
    }
  }

  async onMapClick() {
    const googleMaps = await this.gmaps.loadGoogleMaps();
    this.mapClickListener = googleMaps.event.addListener(
      this.map,
      'click',
      async (mapsMouseEvent: { latLng: { toJSON: () => any } }) => {
        console.log(mapsMouseEvent.latLng.toJSON());
        const address = await this.gmaps.reverseGeocodeLatLng(
          mapsMouseEvent.latLng.toJSON()
        );
        console.log(address);
        if (address) {
          this.addMarker(mapsMouseEvent.latLng, address);
        } else {
          console.log('Unable to fetch address for the clicked location');
        }
      }
    );
  }

  addMarker(location: any, address: string) {
    let googleMaps: any = this.googleMaps;
    const icon = {
      url: 'assets/icons/location-pin.png',
      scaledSize: new googleMaps.Size(40, 50),
    };

    // Eliminar marcadores anteriores
    this.markers.forEach((marker: any) => {
      marker.setMap(null);
    });
    this.markers = [];

    // Agregar el nuevo marcador
    const marker = new googleMaps.Marker({
      position: location,
      map: this.map,
      icon: icon,
      title: address, // Mostrar la dirección como título del marcador
      // draggable: true,
      animation: googleMaps.Animation.DROP,
    });
    this.markers.push(marker);

    // this.presentActionSheet();
    this.markerClickListener = this.googleMaps.event.addListener(
      marker,
      'click',
      () => {
        console.log('markerclick', marker);
        this.checkAndRemoveMarker(marker);
        console.log('markers: ', this.markers);
      }
    );
    this.locationInfo = `Latitud: ${location.lat()}, Longitud: ${location.lng()}, Dirección: ${address}`;
    this.changeDetectorRef.detectChanges();
  }

  checkAndRemoveMarker(marker: {
    position: { lat: () => any; lng: () => any };
  }) {
    const index = this.markers.findIndex(
      (x) =>
        x.position.lat() == marker.position.lat() &&
        x.position.lng() == marker.position.lng()
    );
    console.log('is marker already: ', index);
    if (index >= 0) {
      this.markers[index].setMap(null);
      this.markers.splice(index, 1);
      return;
    }
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Added Marker',
      subHeader: '',
      buttons: [
        {
          text: 'Remove',
          role: 'destructive',
          data: {
            action: 'delete',
          },
        },
        {
          text: 'Save',
          data: {
            action: 'share',
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
          data: {
            action: 'cancel',
          },
        },
      ],
    });

    await actionSheet.present();
  }

  ngOnDestroy() {
    // this.googleMaps.event.removeAllListeners();
    if (this.mapClickListener)
      this.googleMaps.event.removeListener(this.mapClickListener);
    if (this.markerClickListener)
      this.googleMaps.event.removeListener(this.markerClickListener);
  }
}
