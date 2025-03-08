import { component } from "../core";

export interface CardProps {
    image: string;
    name: string;
    description: string;
    width: number;
    height: number;
}

export const card = (data: CardProps) => component.html`
    <div class="card"> 
        <img src="${data.image}" width="${data.width}" height="${data.height}" class="card-img-top" alt="${data.name}">
        <div class="card-body">
            <h5 class="card-title">${data.name}</h5>
            <p class="card-text">${data.description}</p>
        </div>
    </div>
`;
