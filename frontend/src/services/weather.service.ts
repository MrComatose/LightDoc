import { Observable } from "rxjs";



interface GeometryLocation {
    lat: number;
    lng: number;
}

// Інтерфейс для геометрії місця (location)
interface Geometry {
    location: GeometryLocation;
}

// Інтерфейс для одного місця (кандидата)
interface PlaceCandidate {
    formatted_address: string;
    geometry: Geometry;
    name: string;
}


export interface WeatherEvent {
    type: 'danger' | 'warning' | 'success';
    message: string;
    valid: boolean;
    location: PlaceCandidate;
}
export const subscribeToWeather = (password: string): Observable<WeatherEvent> => {
    return new Observable<WeatherEvent>((observer) => {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'; // Use 'wss' for HTTPS, 'ws' for HTTP
        const socketUrl = `${protocol}://${window.location.host}/websocket?password=${password}`;
        const socket = new WebSocket(socketUrl);

        // When WebSocket connection opens
        socket.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        // Handle incoming messages from the WebSocket
        socket.onmessage = (event) => {
            try {
                const weatherEvent: WeatherEvent = JSON.parse(event.data);
                observer.next(weatherEvent); // Emit event to subscribers
            } catch (error) {
                observer.error('Error parsing message');
            }
        };

        // Handle WebSocket errors
        socket.onerror = (error) => {
            observer.error('WebSocket error: ' + error);
        };

        // Handle WebSocket connection close
        socket.onclose = () => {
            observer.complete(); // Complete observable when connection is closed
        };

        // Cleanup function when the subscriber unsubscribes
        return () => {
            socket.close();
        };
    });
};
