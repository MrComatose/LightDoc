

const apiKey = "live_s58Vm8qR1u3uhRRd91tKaVWNUfKGMqQUIQdPLaGikvYskgw7rdZs7TaisE39LPUt";
const url = "https://api.thecatapi.com/v1";

const headers = new Headers({
    "Content-Type": "application/json",
    "x-api-key": apiKey
});

interface Weight {
    imperial: string;
    metric: string;
}

export interface Breed {
    weight: Weight;
    id: string;
    name: string;
    cfa_url: string;
    vetstreet_url: string;
    vcahospitals_url: string;
    temperament: string;
    origin: string;
    country_codes: string;
    country_code: string;
    description: string;
    life_span: string;
    indoor: number;
    lap: number;
    alt_names: string;
    adaptability: number;
    affection_level: number;
    child_friendly: number;
    dog_friendly: number;
    energy_level: number;
    grooming: number;
    health_issues: number;
    intelligence: number;
    shedding_level: number;
    social_needs: number;
    stranger_friendly: number;
    vocalisation: number;
    experimental: number;
    hairless: number;
    natural: number;
    rare: number;
    rex: number;
    suppressed_tail: number;
    short_legs: number;
    wikipedia_url: string;
    hypoallergenic: number;
    reference_image_id: string;
}

export class Cat {
    constructor(init: Partial<Cat> = {}) {
        this.breeds = init.breeds ?? [];
        this.id = init.id ?? '';
        this.url = init.url ?? '';
        this.width = init.width ?? 64;
        this.height = init.height ?? 64;
    }
    breeds: Breed[];
    id: string;
    url: string;
    width: number;
    height: number;
}

export const getCats = async (count = 1): Promise<Cat[]> => {
    var requestOptions: RequestInit = {
        method: 'GET',
        headers: headers,
        redirect: 'follow'
    };

    const resp = await fetch(`${url}/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&page=0&limit=${count}`, requestOptions);

    const data = await resp.json()

    return data.map((x: any) => new Cat(x));
}