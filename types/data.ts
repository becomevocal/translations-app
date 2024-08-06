export interface FormData {
    [k: string]: any;
}

export interface LanguagesTableItem {
    code: string;
    status: string;
    is_default: boolean;
}

export interface ListItem extends FormData {
    id: number;
}

export interface StringKeyValue {
    [key: string]: string;
}
