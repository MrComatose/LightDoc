import { from, Observable } from "rxjs";
import { switchMap, take } from "rxjs/operators";

import { user$ } from "./user.service";
import { apiOrigin } from "./config.service";

import { UserKey, PresignedUrl, CreateKeyResponse } from '../../../shared/models';

const apiUrl = `${apiOrigin}/api/keys`;

const fetchKeysFromAPI = (token: string): Promise<UserKey[]> => {
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

export const getKeys = (): Observable<UserKey[]> => {
    return user$.pipe(
        take(1),
        switchMap(user => {
            const token = user?.getIdToken();

            if (!token) {
                return new Observable<UserKey[]>(observer => {
                    observer.error(new Error("No ID token available"));
                });
            }

            return from(fetchKeysFromAPI(token.getJwtToken()));
        })
    );
};

const fetchKeyFromAPI = (token: string, fileId: string): Promise<UserKey> => {
    return fetch(`${apiUrl}/${fileId}`, {
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

export const getKeyById = (fileId: string): Observable<UserKey> => {
    return user$.pipe(
        take(1),
        switchMap(user => {
            const token = user?.getIdToken();

            if (!token) {
                return new Observable<UserKey>(observer => {
                    observer.error(new Error("No ID token available"));
                });
            }

            return from(fetchKeyFromAPI(token.getJwtToken(), fileId));
        })
    );
};

const deleteKeyFromAPI = (token: string, fileId: string): Promise<void> => {
    return fetch(`${apiUrl}/${fileId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to delete key: ${response.statusText}`);
            }
        });
};


export const deleteKey = (fileId: string): Observable<void> => {
    return user$.pipe(
        take(1),
        switchMap(user => {
            const token = user?.getIdToken();

            if (!token) {
                return new Observable<void>(observer => {
                    observer.error(new Error("No ID token available"));
                });
            }

            return from(deleteKeyFromAPI(token.getJwtToken(), fileId));
        })
    );
};

const uploadFileToS3 = (file: File, presignedUrl: PresignedUrl): Promise<void> => {
    const formData = new FormData();

    Object.entries(presignedUrl.fields).forEach(([key, value]) => {
        formData.append(key, value);
    });

    formData.append("file", file);

    return fetch(presignedUrl.url, {
        method: "POST",
        body: formData,
    }).then(response => {
        if (!response.ok) {
            throw new Error(`Failed to upload file to S3: ${response.statusText}`);
        }
    });
};

const createKeyRequest = (token: string, filename: string): Promise<CreateKeyResponse> => {
    return fetch(apiUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename }),
    }).then(response => {
        if (!response.ok) {
            throw new Error(`Failed to create key: ${response.statusText}`);
        }
        return response.json();
    });
};

const saveFileAsync = async (token: string, file: File) => {
    const { id, presignedUrl } = await createKeyRequest(token, file.name);

    await uploadFileToS3(file, presignedUrl);

    return id;
}

export const uploadKey = (file: File): Observable<string> => {
    return user$.pipe(
        take(1),
        switchMap(user => {
            const token = user?.getIdToken();

            if (!token) {
                throw new Error("No ID token available");
            }

            return from(saveFileAsync(token.getJwtToken(), file));
        })
    );
};