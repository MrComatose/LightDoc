import { Observable } from "rxjs";
import { switchMap, take } from "rxjs/operators";

import { user$ } from "./user.service";

const apiUrl = "https://dc8dc9apo9sjg.cloudfront.net/api/documents";

export interface UserDocument {
    fileId: string;
    s3Key: string;
    date: string;
    email: string;
    filename: string;
    presignedUrl: string;
}

const fetchDocumentsFromAPI = (token: string): Promise<UserDocument[]> => {
    return fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch documents: ${response.statusText}`);
            }
            return response.json();
        });
};

export const getDocuments = (): Observable<UserDocument[]> => {
    return user$.pipe(
        take(1),
        switchMap(user => {
            const token = user?.getIdToken();

            if (!token) {
                return new Observable<UserDocument[]>(observer => {
                    observer.error(new Error("No ID token available"));
                });
            }

            return new Observable<UserDocument[]>(observer => {
                fetchDocumentsFromAPI(token.getJwtToken())
                    .then(documents => {
                        observer.next(documents);
                        observer.complete();
                    })
                    .catch(err => {
                        observer.error(err);
                    });
            });
        })
    );
};