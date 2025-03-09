import { from, Observable } from "rxjs";
import { finalize, map, shareReplay, switchMap } from "rxjs/operators";
import { btn, link, progressBar, table, TableColumn } from "../components";
import { bind, component, effect, observe } from "../core";
import { deleteDocument, getDocumentById, getDocuments, uploadDocument } from "../services"; // Assuming you have a service for getting documents

import './documents.scss';
import { fileInput } from "../components/file-input";
import { UserDocument } from "../../../shared/models";
import { documentsLayout } from "../layout/documents.layout";

const loading = bind<boolean>(true);
const loader = loading.asObservable().pipe(map(x => x ? progressBar : ""));

const documents = bind<UserDocument[]>([]);

const loadAlldocs = () => {
    loading.value = true;
    getDocuments().pipe(finalize(() => {
        loading.value = false;
    })).subscribe(x => documents.value = x);
}


const documentsColumns = bind<TableColumn<UserDocument>[]>([
    {
        label: 'Файл',
        value: x => link({
            path: x.presignedUrl,
            label: x.name,
            native: true
        })
    },
    {
        label: 'Емейл',
        value: x => x.email
    },
    {
        label: 'Дата',
        value: x => x.date
    },
    {
        label: 'Статус',
        value: x => x.status
    },
    // {
    //     label: '',
    //     value: x => btn('Видалити', () => {
    //         loading.value = true;
    //         deleteDocument(x.id)
    //             .pipe(finalize(() => {
    //                 loading.value = false;
    //             }))
    //             .subscribe(
    //                 () => {
    //                     documents.value = documents.value.filter(d => d.id !== x.id);
    //                 }
    //             );

    //     })
    // },
]);

const file = bind<File | undefined>(undefined);

export const documentsPage = documentsLayout(
    table({
        data$: documents.asObservable(),
        columns$: documentsColumns.asObservable(),
        idGetter: row => row.id
    }),
    fileInput('Додайте файл', file),
    "Test"
).afterViewInit(c => {
    loadAlldocs();
    effect(() => {
        if (!file.value) {
            return;
        }

        loading.value = true;
        uploadDocument(file.value)
            .pipe(
                finalize(() => {
                    loading.value = false;
                }),
                switchMap(fileId => getDocumentById(fileId))
            )
            .subscribe(newDoc => {
                file.value = undefined;

                documents.value = [...documents.value, newDoc]
            });
    });
});



export const documentsPage2 = component.html`
    <div class="documents-page"> 
        ${observe(loader)}
        
        <div class="documents-page__container"> 
            ${fileInput('Додайте файл', file)}
            ${table({
    data$: documents.asObservable(),
    columns$: documentsColumns.asObservable(),
    idGetter: row => row.id
})}
        </div>  
    </div>`.afterViewInit(c => {
    loadAlldocs();
    effect(() => {
        if (!file.value) {
            return;
        }

        loading.value = true;
        uploadDocument(file.value)
            .pipe(
                finalize(() => {
                    loading.value = false;
                }),
                switchMap(fileId => getDocumentById(fileId))
            )
            .subscribe(newDoc => {
                file.value = undefined;

                documents.value = [...documents.value, newDoc]
            });
    });
});
