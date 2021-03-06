export interface ApolloFetch {
    (operation: GraphQLRequest): Promise<FetchResult>;
    use: (middlewares: MiddlewareInterface) => ApolloFetch;
    useAfter: (afterwares: AfterwareInterface) => ApolloFetch;
}
export interface GraphQLRequest {
    query?: string;
    variables?: object;
    operationName?: string;
}
export interface FetchResult {
    data: any;
    errors?: any;
    extensions?: any;
}
export declare type MiddlewareInterface = (request: RequestAndOptions, next: Function) => void;
export interface RequestAndOptions {
    request: GraphQLRequest;
    options: RequestInit;
}
export declare type AfterwareInterface = (response: ResponseAndOptions, next: Function) => void;
export interface ResponseAndOptions {
    response: ParsedResponse;
    options: RequestInit;
}
export interface ParsedResponse extends Response {
    raw: string;
    parsed?: any;
}
export interface FetchOptions {
    uri?: string;
    customFetch?: any;
}
export interface FetchError extends Error {
    response: ParsedResponse;
    parseError?: Error;
}
