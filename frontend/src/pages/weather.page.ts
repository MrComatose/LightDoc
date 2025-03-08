import { Loader } from '@googlemaps/js-api-loader'; // Імпорт Google Maps API Loader
import { finalize, from, map, Observable, switchMap, takeUntil } from "rxjs";
import { btn, formControl } from "../components";
import { bind, component, observe } from "../core";
import { subscribeToWeather, WeatherEvent } from "../services";
import { store } from "../store";

const darkThemeStyles = [
    { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#303030' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#37474f' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
];

const golegoleApiKey = "AIzaSyCh8NCqldHmEAoEOPDjC2WLY8MeQArQDQU";
// Функція для ініціалізації карти
const initMap = async (theme: string) => {
    const loader = new Loader({
        apiKey: golegoleApiKey, // Замініть на свій API-ключ
        version: 'weekly',
    });

    await loader.load();

    // Створення карти, з центром на Україні
    const centerCoords = { lat: 48.3794, lng: 31.1656 };
    return new google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: centerCoords,
        zoom: 6,
        styles: theme === 'dark' ? darkThemeStyles : undefined
    });
};
const initMap$ = (theme: string) => from(initMap(theme));

// Додавання маркерів на карту
const addMarker = (gMap: google.maps.Map, lat: number, lng: number, message: string, color: string) => {
    const iconUrl = `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
    const marker = new google.maps.Marker({
        position: { lat, lng },
        map: gMap,
        title: message,
        icon: iconUrl
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `<div>${message}</div>`,
    });

    marker.addListener('click', () => {
        infoWindow.open(gMap, marker);
    });
};

const colorsMap = {
    'danger': 'red',
    'warning': 'yellow',
    'success': 'green'
};
// Створення сторінки з картою і потоком повідомлень
export const mapComponent = (messages$: Observable<WeatherEvent>) => component.html`<div id="map" style="height: 900px; width: 100%;"></div>`.afterViewInit((c) => {

    store.theme$.pipe(
        takeUntil(c.detached$),
        switchMap(t => initMap$(t)),
        switchMap(gMap => messages$.pipe(map(e => [gMap, e] as [google.maps.Map, WeatherEvent]))),

    ).subscribe(([gMap, event]) => {

        if (event.location && event.location.geometry) {
            const lat = event.location.geometry.location.lat;
            const lng = event.location.geometry.location.lng;
            addMarker(gMap, lat, lng, event.message, colorsMap[event.type]);
        }
    });
});


const password = bind<string>("");
const confirmedPassword = bind<string>("");

const confirmBtn = btn("Confirm", () => {
    confirmedPassword.value = password.value;
});

const view$ = confirmedPassword.asObservable().pipe(map(x => {
    if (x) {
        const messages$ = subscribeToWeather(x);
        return mapComponent(messages$)
    }

    return component.html`<div class="sign-in__container"> 
    <h1>Log In</h1>
    ${formControl("Password", password, { type: 'password' })}
    ${confirmBtn}
</div>`
}))


export const weatherPage = observe(view$);
