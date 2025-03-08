import { map, Observable, scan, shareReplay } from "rxjs";
import { btn, typingMarkdown } from "../components";
import { textarea } from "../components/textarea";
import { bind, component, Component, html, loop } from "../core";
// import { gpt } from "../services";


// const prompt = bind<string>("");

// const confirmedPrompt = bind<string>(prompt.value);

// const textArea = textarea("Enter a prompt", prompt);

// const confirmBtn = btn("Confirm", () => {
//     confirmedPrompt.value = prompt.value;
//     prompt.value = '';
// })

// const chat$ = confirmedPrompt
//     .asObservable()
//     .pipe(
//         map((p): [string, Observable<string>] => [p, gpt(p)]),
//         map(([prompt, answer]) => component.html`<div> <h4>${prompt}</h4> ${typingMarkdown(answer)}</div>`),
//         scan((acc, answ) => [...acc, answ], [] as Component[]), shareReplay(1)
//     );

// const result = loop(chat$);



// export const gptPage = component.html`<div style="width: 80%"> 
//                 <div>${result}</div>
//                 <div>${textArea} ${confirmBtn}</div>
//             </div>`;