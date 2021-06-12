interface DadataSuggestionData {
    geo_lat: string;
    geo_lon: string;
}

interface DadataSuggestion {
    value: string;
    unrestricted_value: string;
    data: DadataSuggestionData
}

export default interface DadataSuggestions {
    suggestions: DadataSuggestion[];
}