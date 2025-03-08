import { component } from "../core";

export const unexpectedError = ({ message }: Error) => component.html`
    <div class="error-container">
        <h1>Oops! Something went wrong.</h1>
        <p>${message || "An unexpected error occurred. Please try again later."}</p>
    </div>
`;