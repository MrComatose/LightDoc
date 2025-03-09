import { fromEvent, map, takeUntil } from "rxjs";
import { UserDocument } from "../../../shared/models";
import { Binding, component, loop } from "../core";


export interface DocumentsPanelProps {
    documents: Binding<UserDocument[]>;
    selectedDocument: Binding<UserDocument | undefined>;
}

export const panelItem = (
    doc: UserDocument,
    selectedIdBinding: Binding<UserDocument | undefined>,
) => component.html`
  <a class="panel-block ${doc.id === selectedIdBinding.value?.id ? 'is-active' : ''}">
    <span class="panel-icon">
      <i class="fas fa-file" aria-hidden="true"></i>
    </span>
    ${doc.name}
  </a>
`.afterViewInit(component => {
    const panelItemElement = component.getElem() as HTMLAnchorElement;


    if (!panelItemElement) {
        throw new Error("Failed to init panel item.");
    }

    // Handle click event
    fromEvent<MouseEvent>(panelItemElement, 'click').subscribe(() => {
        selectedIdBinding.value = doc; // Update the selected ID on click
    });

    // Sync with the selected ID from the binding
    selectedIdBinding.asObservable().pipe(
        takeUntil(component.detached$)
    ).subscribe(selectedDoc => {
        if (selectedDoc?.id === doc.id) {
            panelItemElement.classList.add('is-active');
        } else {
            panelItemElement.classList.remove('is-active');
        }
    });
});


export const documentsPanel = (props: DocumentsPanelProps) => {
    const fileComponents$ = props.documents.asObservable()
        .pipe(map(docs => docs.map(d => panelItem(d, props.selectedDocument))));

    return component.html`
    <article class="panel is-success">
  <p class="panel-heading">Success</p>
  <p class="panel-tabs">
    <a class="is-active">All</a>
    <a>Public</a>
    <a>Private</a>
    <a>Sources</a>
    <a>Forks</a>
  </p>
  ${loop(fileComponents$)}
</article>
    `.afterViewInit(() => {

    });
}