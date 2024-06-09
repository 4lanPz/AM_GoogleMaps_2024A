# Ionic Geolocalización

Hacer un página que permita utilizar la API de Google Maps utilizando Ionic, Visual Studio Code y Android Studio

## Clonar
```bash
Git clone https://github.com/4lanPz/AM_GoogleMaps_2024A
```
Agregar keys en "environment.ts" y "environment.prod.ts" para android

## Pasos

- 1 Pre requisitos

Tener instalado Node.JS y Npm
Tener un IDE para customizar nuestro proyecto en este caso Visual Studio Code
Generar key de Google Maps
Tener Android Studio configurado
Estos se pueden descargar desde la pagina web oficial de dependiendo de el OS que estes utilizando.

- 2 Empezar el proyecto

Para empezar el proyecto hay que ejecutar el siguiente comando

```bash
npx ionic Start nombreproyecto blank --type=angular
```

En este nombreproyecto es el nombre que le vamos a poner a nuestro proyecto, por lo que se puede poner el
que tu quieras para tu proyecto.

En este tambien debemos elegir que módulos vamos a ocupar, en este caso vamos a ocupar "NGModules"

Al finalizar no es necesario tener una cuenta de Ionic, asi que eso podemos indicar que no y con eso nuestro
proyecto se ha creado

- 3 Navegar al directorio e intalación dependencias
Utilizando la consola CMD podemos ir a el directorio de nuestro proyecto con 
```bash
cd nombreproyecto
```
Dentro de esta carpeta tendremos que instalar los módulos necesarios para que se ejecute nuestro proyecto:
```bash
npm install --legacy-peer-deps
```
Después de instalar los módulos del proyecto, es necesario generar las páginas y servicios necesarios para nuestra aplicación
Para ello necesitamos ejecutar el siguiente comando
```bash
npx ionic g page home
npx ionic g services/gmaps/gmaps
```
- 4 Funcionalidad
Teniendo ya nuestros directorios de nuestra aplicacion primero vamos a ingresar el html en donde va a mostrarse nuestro mapa, en este caso en "home.page.html"
```bash
<ion-header>
  <ion-toolbar>
    <ion-title> Ionic - Google Mapas </ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <div class="map-info" style="padding: 1%;">
    <h3>Información de ubicación</h3>
    <p>{{ locationInfo }}</p>
  </div>
  <div class="map" #map></div>
</ion-content>

```
Gracias a esto podremos saber en nuestro archivo .ts en donde va a generarse nuestras funcionalidades como el mapa y la longitud y latitud en donde coloquemos nuestro marker.

Ahora en nuestro archivo "gmaps.service.ts" vamos a codificar toda la lógica de nuestro Google Maps
```bash
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

```
En esta utilizaremos el SDK de Google Maps para poder renderizar el mapa de google maps y asi mismo una funcion para obtener los datos de las coordenadas del marcador.

Ahora necesitamos generar la lógica ya que va a tener nuestro mapa, sus funcionalidades y como se va a comportar en nuestra aplicación, por lo que ahora en nuestro HomePage de "home.page.ts" 
```bash
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
```
En este necesitamos los contructores y las configuraciones el maps, como inicialmente necesitamos que se carge necesitamos indicarle cuando se cuarda y que hace, en esta función cuando ya está cargado se encuentran funciones que permiten que nuestro Mapa tenga funcionalidades ademas de solo mostrar el mapa
```bash
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
```
Estas funciones ayudan a que maps tenga funcionalidades como generar un marker o punto en el mapa para señalar algo y con ayuda de la otra función podemos hacer que la longitud y latitud de ese punto se nos muestre en nuestra página, asi como poder hacer que el marcador pueda cambiar y que nos muestre la localización del nuevo punto.

Para que nuestro marcador se muestre necesitamos indicar como va a ser el marcador por lo que necesitamos una imagen formato ".png" para que se muestre donde demos click en nuestro mapa, para ello necesitamos agregar el archivo en la carpeta icons y generar la carpeta icons, en donde vamos a pegar nuestro icono del marcador de Google Maps

```bash
nombreproyecto/
├── node_modules/
├── src/   <----------
│   ├──assets/  <---------- se encuentra aqui
│   │   ├──icons <---------- Crear esta carpeta
│   │   │   ├──imagen.png  <---------- nuestra imagen
```


- 5 Ejecución
Para poder probar nuestro proyecto y ver los cambios que hemos hecho a nuestro proyecto se debe ejecutar
```bash
npx ionic start 
```
ahora el programa empezará a generar nuestro proyecto para el sistema en el que estamos ejecutando, en este caso
Windows.
Para poder revisarlo en android es necesario tener un programa que pueda generar el paquete APK
En este caso Android Studio.
Para esto primero necesitaremos hacer un build para android por lo que ejecutamos:
Un problema que suele ocurrir al momento de generar el build de Android es que no suele encontrar las credenciales de Firebase, para solucionar esto hay que pasar las credenciales de enviroment.ts y copiarlas tambien en enviroment.prod.ts
```bash
npx ionic build android
```
Al ejecutar ese código empezará a generar los archivos necesarios para que el mismo proyecto que vimos en web se
pueda ver en Android.
Luego de tener generado el build para android se debe ejecutar el comando

```bash
npx ionic capacitor open android
```
Con esto se abrirá Android Studio y si ya tenemos un dispositivo configurado, podremos ver como se ve nuestro
proyecto en android

## Capturas
### Web
![image](https://github.com/4lanPz/AM_GoogleMaps_2024A/assets/117743495/abb9a50c-87b5-4be6-9eb5-d8c5bdd3a598)

![image](https://github.com/4lanPz/AM_GoogleMaps_2024A/assets/117743495/c56e0eab-0dbb-4404-abbc-dcf17389cbdf)

### Android

![image](https://github.com/4lanPz/AM_GoogleMaps_2024A/assets/117743495/576c17be-ae4c-473b-beb6-5b7540825ed4)

![image](https://github.com/4lanPz/AM_GoogleMaps_2024A/assets/117743495/8c59407a-4cb3-4d64-8012-21c59f9e4248)

