

import { Rune, component } from "../core";


export const documentsLayout = (navigation: Rune, actions: Rune, child: Rune) => component.html`
<div class="container is-flex is-justify-content-center">
    <div class="columns is-gapless is-fullheight" >
        <aside class="column is-3 p-4 has-background-light">
            ${navigation}
        </aside>
        <main class="column is-9 is-flex is-flex-direction-column">    
            ${actions}
            ${child}
        </main>
    </div>
</div>
`;