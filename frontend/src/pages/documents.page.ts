import { distinctUntilChanged, finalize, map, startWith, switchMap, tap } from "rxjs/operators";
import { btn, progressBar } from "../components";
import { bind, component, effect, observe } from "../core";
import { deleteDocument, getDocumentById, getDocuments, uploadDocument } from "../services"; // Assuming you have a service for getting documents

import { UserDocument } from "../../../shared/models";
import { fileInput } from "../components/file-input";
import { documentsLayout } from "../layout/documents.layout";
import { RouteConfig, routeOutlet, router } from "../router";
import { documentsPanel } from "../sections";
import './documents.scss';

const loading = bind<boolean>(true);
const loader = observe(loading.asObservable().pipe(map(x => x ? progressBar : "")));

const documents = bind<UserDocument[]>([], "Documents");

const loadAlldocs = () => {
    loading.value = true;
    getDocuments().pipe(finalize(() => {
        loading.value = false;
    })).subscribe(x => documents.value = x);
}

const file = bind<File | undefined>(undefined, "File");
const selectedDocument = bind<UserDocument | undefined>(undefined, "Document");
const filePreview = observe(selectedDocument.asObservable().pipe(map(x => component.html`
    <iframe src="https://viewerjs.org/ViewerJS/?presentation=true&zoom=1.5#${x?.presignedUrl ?? ""}" width="100%" height="600px"></iframe>
    `)));
const routes: RouteConfig[] = [
    {
        path: '/:id',
        view: ({ id }) => component(() => {
            effect(() => {
                selectedDocument.value = documents.value.find(x => x.id === id);
            });

            return filePreview;
        })
    },
    {
        path: '',
        view: () => component(() => {
            effect(() => {
                selectedDocument.value = documents.value[0];
            });
        })

    }

];
const documentsRouter = routeOutlet(routes);

const deleteButton = btn(`Видалити`, () => {
    if (selectedDocument.value) {
        const id = selectedDocument.value.id;
        deleteDocument(id).subscribe(() => {
            documents.value = documents.value.filter(d => d.id !== id);
            router.navigateTo('/documents');
        })
    }

}, 'is-danger');

const deleteButtonForSelectedDocument = selectedDocument.asObservable().pipe(
    startWith(selectedDocument.value),
    map(x => !!x),
    distinctUntilChanged(),
    map(x => x ? deleteButton : '')
);

export const documentsPage = documentsLayout(
    documentsPanel({
        documents,
        selectedDocument
    }),
    component.html`
    ${loader}
<nav class="navbar" role="navigation" aria-label="main navigation">
  <div id="navbarBasicExample" class="navbar-menu">
    <div class="navbar-end">
      <div class="navbar-item">
        <div class="buttons">
        ${observe(deleteButtonForSelectedDocument)}
        ${fileInput('Додати файл', file)}
        </div>
      </div>
    </div>
  </div>
</nav>
    `,
    documentsRouter
).afterViewInit(c => {
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

    effect(() => {
        if (!selectedDocument.value) {
            return;
        }

        router.navigateTo(`/documents/${selectedDocument.value.id}`);
    });

    loadAlldocs();
});