

import { Rune, component } from "../core";


export const documentsLayout = (navigation: Rune, actions: Rune, child: Rune) => component.html`
<div class="container is-flex is-justify-content-center">
    <div class="columns is-gapless is-fullheight" >
        <aside class="column is-5 p-4 has-background-light">
            ${navigation}
        </aside>
        <main class="column is-7 is-flex is-flex-direction-column">
            <div class="box mb-4">
                ${actions}
            </div>
            <div class="content p-4">
                ${child}
            </div>
        </main>
    </div>
</div>
`;