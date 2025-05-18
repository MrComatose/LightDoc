import { from, Observable } from "rxjs";
import { switchMap, take } from "rxjs/operators";

import { user$ } from "./user.service";
import { apiOrigin } from "./config.service";

import { UserDocument, PresignedUrl, CreateDocumentResponse } from '../../../shared/models';

const apiUrl = `${apiOrigin}/api/documents`;

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

            return from(fetchDocumentsFromAPI(token.getJwtToken()));
        })
    );
};

const fetchDocumentFromAPI = (token: string, fileId: string): Promise<UserDocument> => {
    return fetch(`${apiUrl}/${fileId}`, {
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

export const getDocumentById = (fileId: string): Observable<UserDocument> => {
    return user$.pipe(
        take(1),
        switchMap(user => {
            const token = user?.getIdToken();

            if (!token) {
                return new Observable<UserDocument>(observer => {
                    observer.error(new Error("No ID token available"));
                });
            }

            return from(fetchDocumentFromAPI(token.getJwtToken(), fileId));
        })
    );
};

const deleteDocumentFromAPI = (token: string, fileId: string): Promise<void> => {
    return fetch(`${apiUrl}/${fileId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to delete document: ${response.statusText}`);
            }
        });
};


export const deleteDocument = (fileId: string): Observable<void> => {
    return user$.pipe(
        take(1),
        switchMap(user => {
            const token = user?.getIdToken();

            if (!token) {
                return new Observable<void>(observer => {
                    observer.error(new Error("No ID token available"));
                });
            }

            return from(deleteDocumentFromAPI(token.getJwtToken(), fileId));
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

const createDocumentRequest = (token: string, filename: string): Promise<CreateDocumentResponse> => {
    return fetch(apiUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename }),
    }).then(response => {
        if (!response.ok) {
            throw new Error(`Failed to create document: ${response.statusText}`);
        }
        return response.json();
    });
};

const saveFileAsync = async (token: string, file: File) => {
    const { id, presignedUrl } = await createDocumentRequest(token, file.name);

    await uploadFileToS3(file, presignedUrl);

    return id;
}

export const uploadDocument = (file: File): Observable<string> => {
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


const signDocumentRequest = (token: string, docId: string, keyId: string, password: string, issuer: string): Promise<any> => {
    return fetch(`${apiUrl}/${docId}/sign`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyId, password, issuer }),
    }).then(response => {
        if (!response.ok) {
            throw new Error(`Failed to sign document: ${response.statusText}`);
        }
        return response.json();
    });
};

export const signUserDocument = (docId: string, keyId: string, password: string, issuer: string): Observable<string> => {
    return user$.pipe(
        take(1),
        switchMap(user => {
            const token = user?.getIdToken();

            if (!token) {
                throw new Error("No ID token available");
            }

            return from(signDocumentRequest(token.getJwtToken(), docId, keyId, password, issuer));
        })
    );
};