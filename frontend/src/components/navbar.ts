import { interval, map, startWith } from "rxjs";
import { component, observe, Rune } from "../core";
import { link } from "./link";
import { themeSwitcher } from "./theme-switcher";
import { getClaims } from "../services/user.service";

const time$ = interval(1000).pipe(
    map(() => (new Date().toLocaleTimeString())),
    startWith("Loading..."));
const time = observe(time$);

const homeLink = link({ label: "Chat GPT", path: "/home" });
const signIn = link({ label: "LogIn", path: "/sign-in" });

const claims$ = getClaims()

const unauthorizedContent = component.html`
<li class="nav-item">${signIn}</li>`;

const authorizedContent = (email: string | null) => component.html`
<li class="nav-item">${email || 'unknown user'}</li>`;

const content$ = claims$.pipe(map(c => c ? authorizedContent(c.email) : unauthorizedContent));

export const navBar = component.html`
        <nav class="navbar fade-in" id="main-navbar"> 
            <div class="navbar__container">
                <div class="navbar-brand">${time}</div>
                <ul class="navbar-nav">
                    ${observe(content$)}
                    
                    <li class="nav-item">${themeSwitcher}</li>
                </ul>
            </div>
        </nav>
    `;

