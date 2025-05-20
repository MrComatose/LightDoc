export enum UserDocumentStatus {
    Signed = 'Signed',
    NonSigned = 'NonSigned',
}

export interface UserDocument {
    id: string;
    status: UserDocumentStatus;
    date: string;
    email: string;
    name: string;
    presignedUrl: string;
    signedFileUrl?: string;
}
export enum UserKeyStatus {
    Verified = 'Verified',
    NonVerified = 'NonVerified',
}

export interface UserKey {
    id: string;
    status: UserKeyStatus;
    date: string;
    email: string;
    name: string;
    presignedUrl: string;
    issuer?: CertificateAuthority;
}

export interface PresignedUrl {
    url: string;
    fields: Record<string, string>;
}

export interface CreateDocumentResponse {
    id: string;
    presignedUrl: PresignedUrl;
}
export interface CreateKeyResponse {
    id: string;
    presignedUrl: PresignedUrl;
}

// Дозволені розширення для підпису ГОСТ
export const ALLOWED_DOC_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".xml"];
export const isValidDocExtension = (filename: string): boolean => {
    return ALLOWED_DOC_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));
};
export const ALLOWED_DSTU_KEY_EXTENSIONS = [".dat", ".pfx", ".pk8", ".zs2", ".jks"];

// Function to validate if the file has a DSTU key extension
export const isValidDstuKeyExtension = (filename: string): boolean => {
    return ALLOWED_DSTU_KEY_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));
};

export interface CertificateAuthority {
    issuerCNs: string[];
    address: string;
    ocspAccessPointAddress: string;
    ocspAccessPointPort: string;
    cmpAddress: string;
    tspAddress: string;
    tspAddressPort: string;
    directAccess?: boolean;
    qscdSNInCert?: boolean;
    cmpCompatibility?: number;
    certsInKey?: boolean;
    codeEDRPOU: string;
};