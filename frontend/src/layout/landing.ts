import { navBar } from "../components/navbar";
import { Rune, component } from "../core";


export const landing = (child: Rune) => component(() => `<div class="landing">
                ${navBar}
                ${child}
            </div>`);
