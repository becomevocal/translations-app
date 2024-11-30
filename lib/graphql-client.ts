interface GraphQLClientConfig {
  accessToken: string;
  storeHash: string;
}

export class GraphQLClient {
  private baseUrl: string;
  private headers: Headers;

  constructor({ accessToken, storeHash }: GraphQLClientConfig) {
    this.baseUrl = `https://api.bigcommerce.com/stores/${storeHash}/graphql`;
    this.headers = new Headers({
      'X-Auth-Token': accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    });
  }

  async request<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const requestOptions = {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
      redirect: 'follow' as RequestRedirect,
    };

    const response = await fetch(this.baseUrl, requestOptions);
    const data = await response.json();

    if (typeof data === 'object' && data && 'errors' in data) {
      throw new Error((data.errors as any[])[0].message);
    }

    return data as T;
  }
}

export function createGraphQLClient(accessToken: string, storeHash: string): GraphQLClient {
  return new GraphQLClient({ accessToken, storeHash });
}
