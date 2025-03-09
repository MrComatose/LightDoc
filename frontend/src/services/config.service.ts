
const isLocalhost = window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1";


export const apiOrigin = isLocalhost ? "http://localhost:3000" : window.location.origin;
