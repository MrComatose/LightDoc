import { Observable, take, switchMap, from } from "rxjs";
import { CertificateAuthority } from "../../../shared/models";
import { apiOrigin } from "./config.service";
import { user$ } from "./user.service";


const apiUrl = `${apiOrigin}/api/issuers`;

const fetchIssuersFromAPI = (token: string): Promise<CertificateAuthority[]> => {
    return fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch keys: ${response.statusText}`);
            }
            return response.json();
        });
};

export const getIssuers = (): Observable<CertificateAuthority[]> => {
    return user$.pipe(
        take(1),
        switchMap(user => {
            const token = user?.getIdToken();

            if (!token) {
                return new Observable<CertificateAuthority[]>(observer => {
                    observer.error(new Error("No ID token available"));
                });
            }

            return from(fetchIssuersFromAPI(token.getJwtToken()));
        })
    );
};