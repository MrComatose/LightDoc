import { combineLatest, fromEvent, map, startWith, switchMap, takeUntil } from "rxjs";
import { UserDocument } from "../../../shared/models";
import { bind, Binding, component, effect, loop } from "../core";
import { btn, formControl } from "../components";
import { fileInput } from "../components/file-input";


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

    fromEvent<MouseEvent>(panelItemElement, 'click').subscribe(() => {
        selectedIdBinding.value = doc; // Update the selected ID on click
    });

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

const search = (binding: Binding<string>) => component.html`
<p class="control has-icons-left">
    <input class="input is-success" type="text" placeholder="Search" />
    <span class="icon is-left">
        <i class="fas fa-search" aria-hidden="true"></i>
    </span>
</p>`.afterViewInit(component => {
    const inputElement = component.getElem().querySelector('input') as HTMLInputElement;

    binding.asObservable().pipe(
        takeUntil(component.detached$)
    ).subscribe(c => inputElement.value = c);

    fromEvent<InputEvent>(inputElement, 'input').pipe(startWith(inputElement.value)).subscribe(() => {
        binding.value = inputElement.value;
    });

});

export const documentsPanel = (props: DocumentsPanelProps) => {
    const selectedStatus = bind<'All' | string>('All');
    const searchStr = bind<string>('');

    const fileComponents$ = props.documents.asObservable()
        .pipe(
            switchMap(() => combineLatest([selectedStatus.asObservable(), searchStr.asObservable()])),
            map(([searchStatus, searchStr]) => {
                const filteredByStatus = searchStatus === 'All' ?
                    props.documents.value :
                    props.documents.value.filter(x => x.status === searchStatus);

                if (searchStr) {
                    return filteredByStatus.filter(x => x.name.trim().toLowerCase().includes(searchStr.trim().toLowerCase()))
                }

                return filteredByStatus;
            }),
            map(docs => docs.map(d => panelItem(d, props.selectedDocument)))
        );

    const statuses = props.documents.asObservable().pipe(
        map(d => ['All', ... new Set(d.map(x => x.status))]),
        map(statuses => statuses.map(s => component.html`<a>${s}</a>`.afterViewInit(
            (c) => {
                const elem = c.getElem();
                effect(
                    () => {
                        if (s === selectedStatus.value) {
                            elem.className = "is-active"
                        } else {
                            elem.className = ""
                        }
                    }
                )

                fromEvent(elem, 'click').pipe(
                    takeUntil(c.detached$)
                ).subscribe(() => {
                    selectedStatus.value = s;
                })
            }
        )))
    );

    return component.html`
        <article class="panel is-success">
            <p class="panel-heading">Завантажені документи
            
            </p>
            ${loop(statuses, { name: 'p', class: 'panel-tabs' })}
            <div class="panel-block">
                ${search(searchStr)}
            </div>
                ${loop(fileComponents$)}
        </article>
    `;
}