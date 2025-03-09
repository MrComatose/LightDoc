export interface UserDocument {
    id: string;
    status: string;
    date: string;
    email: string;
    name: string;
    presignedUrl: string;
}


export interface PresignedUrl {
    url: string;
    fields: Record<string, string>;
}

export interface CreateDocumentResponse {
    id: string;
    presignedUrl: PresignedUrl;
}
