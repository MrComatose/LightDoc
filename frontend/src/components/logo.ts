import { component } from "../core";
import { store } from "../store";

export const logo = component.html`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="80">
  

  <polygon points="90,50 120,30 120,70" fill="#FF5722"/>
  
  <text x="100" y="55" font-family="Arial, sans-serif" font-size="24" fill="#333" text-anchor="middle" alignment-baseline="middle">
    LightDoc
  </text>
</svg>

`.afterViewInit((c) => {

    store.theme$.subscribe((theme) => {
        const el = c.getElem() as HTMLElement;
        el.setAttribute("data-theme", theme);

        // Select the text element and update its color based on the theme
        const textElem = el.querySelector('text');

        if (textElem) {
            if (theme === 'dark') {
                textElem.setAttribute('fill', '#fff');  // White text for dark theme
            } else {
                textElem.setAttribute('fill', '#333');  // Dark text for light theme
            }
        }
    });

});