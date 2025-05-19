import { distinctUntilChanged, finalize, map, startWith, switchMap } from "rxjs/operators";
import { btn, progressBar } from "../components";
import { bind, component, effect, observe } from "../core";
import { deleteDocument, getDocumentById, getDocuments, isAuthenticated, uploadDocument } from "../services"; // Assuming you have a service for getting documents

import { ALLOWED_DOC_EXTENSIONS, UserDocument } from "../../../shared/models";
import { fileInput } from "../components/file-input";
import { documentsLayout } from "../layout/documents.layout";
import { redirect, RouteConfig, routeOutlet, router } from "../router";
import { documentsPanel, signDocument } from "../sections";
import './documents.scss';

const documentsLoading = bind<boolean>(true);
const loader = observe(documentsLoading.asObservable().pipe(map(x => x ? progressBar : "")));

const documents = bind<UserDocument[]>([], "Documents");

const loadAlldocs = () => {
    documentsLoading.value = true;
    getDocuments().pipe(finalize(() => {
        documentsLoading.value = false;
    })).subscribe(x => documents.value = x);
}

const file = bind<File | undefined>(undefined, "File");
const selectedDocumentId = bind<string | undefined>(undefined, "Document");

const selectedDocument = selectedDocumentId.map<UserDocument | undefined>(id => documents.value.find(x => x.id === id), (id, doc) => doc?.id,
    'selectedDocument',
    [documents]);
const routes: RouteConfig[] = [
    {
        path: '/:id',
        view: ({ id }) =>
            documents.select(docs => docs.find(x => x.id === id))
                .mapTo(doc => component.html`
    <iframe src="https://viewerjs.org/ViewerJS/?presentation=true&zoom=1.5#${doc?.presignedUrl ?? ""}" width="100%" height="600px"></iframe>
    `.afterViewInit(() => {
                    selectedDocument.value = doc;

                }))
    },
    {
        path: '',
        view: () => {
            if (selectedDocument.value) {
                return redirect('/documents/' + selectedDocument.value.id);
            }

            return documents.select(docs => docs.length ? redirect('/documents/' + docs[0].id) : component.html`<div>Немає документів</div>`);
        },

    }

];
const documentsRouter = routeOutlet(routes);

const deleteButton = btn(`Видалити`, () => {
    if (selectedDocumentId.value) {
        const id = selectedDocumentId.value;
        documentsLoading.value = true;

        deleteDocument(id).pipe(finalize(() => {
            documentsLoading.value = false;
        })).subscribe(() => {

            documents.value = documents.value.filter(d => d.id !== id);
            selectedDocumentId.value = undefined;
            router.navigateTo('/documents');
        })
    }

}, {
    type: 'is-danger'
});

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
    <div class="navbar-item">
        ${fileInput('Додати файл', file, { allowedExtensions: ALLOWED_DOC_EXTENSIONS })} 
    </div>
    <div class="navbar-end">
      <div class="navbar-item">
        <div class="buttons">
        ${signDocument(selectedDocument)}
        ${observe(deleteButtonForSelectedDocument)}
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

        documentsLoading.value = true;
        uploadDocument(file.value)
            .pipe(
                finalize(() => {
                    documentsLoading.value = false;
                }),
                switchMap(fileId => getDocumentById(fileId))
            )
            .subscribe(newDoc => {
                file.value = undefined;

                documents.value = [...documents.value, newDoc]
                router.navigateTo(`/documents/${newDoc.id}`);
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