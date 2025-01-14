export interface Product {
  id: string;
  basicInformation: {
    name: string;
    description: string;
  };
}

export interface ProductLocaleData {
  name?: string;
  description?: string;
}

