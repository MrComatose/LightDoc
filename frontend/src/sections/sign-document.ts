import { combineLatest, switchMap, takeUntil } from "rxjs";
import { ALLOWED_DSTU_KEY_EXTENSIONS, UserDocument, UserKey } from "../../../shared/models";
import { btn, fileInput, formControl } from "../components";
import { bind, Binding, component, effect, foreEach, ReactiveBinding } from "../core";
import { deleteKey, getKeyById, getKeys, uploadKey, signUserDocument } from "../services";


const defaultFormValue = {
    keyId: '',
    documentId: '',
    keyPwd: '',
    issuer: ''
}

const keySelect = (keys: Binding<UserKey[]>, selectedKeyId: Binding<string>) => {
    const keysOptions = keys.select(keys => keys.map(key => component.html`
        <option value="${key.id}">${key.name}</option>
    `.afterViewInit(c => {
        const selectElem = c.getElem() as HTMLOptionElement;

        selectedKeyId.asObservable().pipe(takeUntil(c.detached$)).subscribe(selectedId => {
            if (key.id === selectedId) {
                selectElem.selected = true;
            }
        }
        );
    })));

    return component.html`
    <div class="select">
        <select>
            ${foreEach(keysOptions)}
        </select>
    </div>`.afterViewInit(c => {
        const selectElem = c.getElem().querySelector('select') as HTMLSelectElement;

        selectElem.addEventListener('change', (event) => {
            selectedKeyId.value = (event.target as HTMLSelectElement).value;
        });
    })
};



const key = bind<File | undefined>(undefined, "File");
const keyFileInput = fileInput('Додати ключ', key, { allowedExtensions: ALLOWED_DSTU_KEY_EXTENSIONS });
const form = bind(defaultFormValue);
const resetFrom = () => {
    form.value = defaultFormValue;
}
const control = (label: string, name: keyof typeof defaultFormValue) => formControl(label,
    form.map(form => form[name], (form, value) => ({ ...form, [name]: value })),
    {
        type: name === 'keyPwd' ? 'password' : 'text'
    }
);

const selectedKeyId = form.map(form => form.keyId, (form, keyId) => ({ ...form, keyId }));
const formDocId = form.map(form => form.documentId, (form, documentId) => ({ ...form, documentId }));

const signDocumentModal = (selectedDocuemnt: Binding<UserDocument | undefined>, show: Binding<boolean>) => {
    const saveBtn = btn('Підписати', () => {

        signUserDocument(form.value.documentId, form.value.keyId, form.value.keyPwd).subscribe((result) => {
            console.log(result);
            show.value = false;
        });
    }, {
        type: 'is-success'
    });
    const closeBtn = btn('Назад', () => {
        show.value = false;
    },);
    const closeIcon = component.html`<button class="delete" aria-label="close"></button>`.afterViewInit(c => {
        const closeBtn = c.getElem() as HTMLElement;
        closeBtn.addEventListener('click', () => {
            show.value = false;
        });
    });
    resetFrom();

    const userKeys = bind<UserKey[]>([]);
    const select = userKeys.select(keys => keys.length > 0 ? keySelect(userKeys, selectedKeyId) : 'Не знайдено ключів для підпису');

    return component.html`
<div class="modal">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Підпис документа</p>
      ${closeIcon}
    </header>
    <section class="modal-card-body">
        <div class="notification is-info">
            <p>Будь ласка, завантажте або оберіть ключ для підпису.</p>
        </div>
        ${keyFileInput}
        ${select}
        <div> 
            ${control('Ім\'я видачі', 'issuer')}
            ${control('Пароль', 'keyPwd')}
        </div>
    </section>
    <footer class="modal-card-foot">
      <div class="buttons">
        ${saveBtn}  
        ${closeBtn}
      </div>
    </footer>
  </div>
</div>
`.afterViewInit(c => {
        const modal = c.getElem() as HTMLElement;

        show.asObservable().pipe(takeUntil(c.detached$)).subscribe((show) => {
            if (show) {
                modal.classList.add('is-active');
            } else {
                modal.classList.remove('is-active');
            }
        });

        selectedDocuemnt.select(x => x?.id).asObservable().pipe(takeUntil(c.detached$)).subscribe(documentId => {
            if (documentId) {
                formDocId.value = documentId;
            }
        });

        effect(() => {
            if (!key.value) {
                return;
            }

            uploadKey(key.value)
                .pipe(
                    switchMap(keyId => getKeyById(keyId))
                )
                .subscribe(newKey => {
                    key.value = undefined;
                    selectedKeyId.value = newKey.id;

                    userKeys.value = [...userKeys.value, newKey];
                });
        });

        getKeys().subscribe(keys => {
            userKeys.value = keys;
            selectedKeyId.value = keys[0]?.id ?? '';
        });
    });
}


const showModal = bind<boolean>(false);
const modal = (selectedDocuemnt: Binding<UserDocument | undefined>) => signDocumentModal(selectedDocuemnt, showModal);


const signDocBtn = (disabled: ReactiveBinding<boolean>) => btn('Підписати документ', () => {
    showModal.value = true;
}, {
    type: 'is-success',
    disabled
});

export const signDocument = (doc: Binding<UserDocument | undefined>) => component.html`${modal(doc)}${signDocBtn(doc.select(x => !x))}`;