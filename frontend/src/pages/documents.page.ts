import { from, Observable } from "rxjs";
import { finalize, map, shareReplay } from "rxjs/operators";
import { link, progressBar, table, TableColumn } from "../components";
import { bind, component, observe } from "../core";
import { getDocuments, UserDocument } from "../services"; // Assuming you have a service for getting documents

import './documents.scss';

const loading = bind<boolean>(true);
const loader = loading.asObservable().pipe(map(x => x ? progressBar : ""));

const documentsData$: Observable<UserDocument[]> = from(getDocuments()).pipe(shareReplay(1), finalize(() => {
    loading.value = false;
}));

const documentsColumns = bind<TableColumn<UserDocument>[]>([
    {
        label: 'File ID',
        value: x => x.fileId
    },
    {
        label: 'S3 Key',
        value: x => x.s3Key
    },
    {
        label: 'Email',
        value: x => x.email
    },
    {
        label: 'Date',
        value: x => x.date
    },
    {
        label: 'Download Link',
        value: x => link({
            path: x.presignedUrl,
            label: x.filename
        })
    }
]);

export const documentsPage = component.html`
    <div class="documents-page"> 
        ${observe(loader)}
        ${table({
    data$: documentsData$,
    columns$: documentsColumns.asObservable()
})}
    </div>`;
