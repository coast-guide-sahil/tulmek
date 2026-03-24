declare const __brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type UserId = Brand<string, "UserId">;
export type Email = Brand<string, "Email">;
export type SessionToken = Brand<string, "SessionToken">;
