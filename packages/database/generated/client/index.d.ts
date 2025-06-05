
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Artist
 * 
 */
export type Artist = $Result.DefaultSelection<Prisma.$ArtistPayload>
/**
 * Model Venue
 * 
 */
export type Venue = $Result.DefaultSelection<Prisma.$VenuePayload>
/**
 * Model Show
 * 
 */
export type Show = $Result.DefaultSelection<Prisma.$ShowPayload>
/**
 * Model Song
 * 
 */
export type Song = $Result.DefaultSelection<Prisma.$SongPayload>
/**
 * Model Setlist
 * 
 */
export type Setlist = $Result.DefaultSelection<Prisma.$SetlistPayload>
/**
 * Model SetlistSong
 * 
 */
export type SetlistSong = $Result.DefaultSelection<Prisma.$SetlistSongPayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Vote
 * 
 */
export type Vote = $Result.DefaultSelection<Prisma.$VotePayload>
/**
 * Model VoteAnalytics
 * 
 */
export type VoteAnalytics = $Result.DefaultSelection<Prisma.$VoteAnalyticsPayload>
/**
 * Model SyncHistory
 * 
 */
export type SyncHistory = $Result.DefaultSelection<Prisma.$SyncHistoryPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Artists
 * const artists = await prisma.artist.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Artists
   * const artists = await prisma.artist.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.artist`: Exposes CRUD operations for the **Artist** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Artists
    * const artists = await prisma.artist.findMany()
    * ```
    */
  get artist(): Prisma.ArtistDelegate<ExtArgs>;

  /**
   * `prisma.venue`: Exposes CRUD operations for the **Venue** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Venues
    * const venues = await prisma.venue.findMany()
    * ```
    */
  get venue(): Prisma.VenueDelegate<ExtArgs>;

  /**
   * `prisma.show`: Exposes CRUD operations for the **Show** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Shows
    * const shows = await prisma.show.findMany()
    * ```
    */
  get show(): Prisma.ShowDelegate<ExtArgs>;

  /**
   * `prisma.song`: Exposes CRUD operations for the **Song** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Songs
    * const songs = await prisma.song.findMany()
    * ```
    */
  get song(): Prisma.SongDelegate<ExtArgs>;

  /**
   * `prisma.setlist`: Exposes CRUD operations for the **Setlist** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Setlists
    * const setlists = await prisma.setlist.findMany()
    * ```
    */
  get setlist(): Prisma.SetlistDelegate<ExtArgs>;

  /**
   * `prisma.setlistSong`: Exposes CRUD operations for the **SetlistSong** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SetlistSongs
    * const setlistSongs = await prisma.setlistSong.findMany()
    * ```
    */
  get setlistSong(): Prisma.SetlistSongDelegate<ExtArgs>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.vote`: Exposes CRUD operations for the **Vote** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Votes
    * const votes = await prisma.vote.findMany()
    * ```
    */
  get vote(): Prisma.VoteDelegate<ExtArgs>;

  /**
   * `prisma.voteAnalytics`: Exposes CRUD operations for the **VoteAnalytics** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VoteAnalytics
    * const voteAnalytics = await prisma.voteAnalytics.findMany()
    * ```
    */
  get voteAnalytics(): Prisma.VoteAnalyticsDelegate<ExtArgs>;

  /**
   * `prisma.syncHistory`: Exposes CRUD operations for the **SyncHistory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SyncHistories
    * const syncHistories = await prisma.syncHistory.findMany()
    * ```
    */
  get syncHistory(): Prisma.SyncHistoryDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Artist: 'Artist',
    Venue: 'Venue',
    Show: 'Show',
    Song: 'Song',
    Setlist: 'Setlist',
    SetlistSong: 'SetlistSong',
    User: 'User',
    Vote: 'Vote',
    VoteAnalytics: 'VoteAnalytics',
    SyncHistory: 'SyncHistory'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "artist" | "venue" | "show" | "song" | "setlist" | "setlistSong" | "user" | "vote" | "voteAnalytics" | "syncHistory"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Artist: {
        payload: Prisma.$ArtistPayload<ExtArgs>
        fields: Prisma.ArtistFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ArtistFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ArtistFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          findFirst: {
            args: Prisma.ArtistFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ArtistFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          findMany: {
            args: Prisma.ArtistFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>[]
          }
          create: {
            args: Prisma.ArtistCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          createMany: {
            args: Prisma.ArtistCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ArtistCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>[]
          }
          delete: {
            args: Prisma.ArtistDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          update: {
            args: Prisma.ArtistUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          deleteMany: {
            args: Prisma.ArtistDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ArtistUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ArtistUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          aggregate: {
            args: Prisma.ArtistAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateArtist>
          }
          groupBy: {
            args: Prisma.ArtistGroupByArgs<ExtArgs>
            result: $Utils.Optional<ArtistGroupByOutputType>[]
          }
          count: {
            args: Prisma.ArtistCountArgs<ExtArgs>
            result: $Utils.Optional<ArtistCountAggregateOutputType> | number
          }
        }
      }
      Venue: {
        payload: Prisma.$VenuePayload<ExtArgs>
        fields: Prisma.VenueFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VenueFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VenuePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VenueFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VenuePayload>
          }
          findFirst: {
            args: Prisma.VenueFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VenuePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VenueFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VenuePayload>
          }
          findMany: {
            args: Prisma.VenueFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VenuePayload>[]
          }
          create: {
            args: Prisma.VenueCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VenuePayload>
          }
          createMany: {
            args: Prisma.VenueCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VenueCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VenuePayload>[]
          }
          delete: {
            args: Prisma.VenueDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VenuePayload>
          }
          update: {
            args: Prisma.VenueUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VenuePayload>
          }
          deleteMany: {
            args: Prisma.VenueDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VenueUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.VenueUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VenuePayload>
          }
          aggregate: {
            args: Prisma.VenueAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVenue>
          }
          groupBy: {
            args: Prisma.VenueGroupByArgs<ExtArgs>
            result: $Utils.Optional<VenueGroupByOutputType>[]
          }
          count: {
            args: Prisma.VenueCountArgs<ExtArgs>
            result: $Utils.Optional<VenueCountAggregateOutputType> | number
          }
        }
      }
      Show: {
        payload: Prisma.$ShowPayload<ExtArgs>
        fields: Prisma.ShowFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ShowFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShowPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ShowFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShowPayload>
          }
          findFirst: {
            args: Prisma.ShowFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShowPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ShowFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShowPayload>
          }
          findMany: {
            args: Prisma.ShowFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShowPayload>[]
          }
          create: {
            args: Prisma.ShowCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShowPayload>
          }
          createMany: {
            args: Prisma.ShowCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ShowCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShowPayload>[]
          }
          delete: {
            args: Prisma.ShowDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShowPayload>
          }
          update: {
            args: Prisma.ShowUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShowPayload>
          }
          deleteMany: {
            args: Prisma.ShowDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ShowUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ShowUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShowPayload>
          }
          aggregate: {
            args: Prisma.ShowAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateShow>
          }
          groupBy: {
            args: Prisma.ShowGroupByArgs<ExtArgs>
            result: $Utils.Optional<ShowGroupByOutputType>[]
          }
          count: {
            args: Prisma.ShowCountArgs<ExtArgs>
            result: $Utils.Optional<ShowCountAggregateOutputType> | number
          }
        }
      }
      Song: {
        payload: Prisma.$SongPayload<ExtArgs>
        fields: Prisma.SongFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SongFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SongPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SongFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SongPayload>
          }
          findFirst: {
            args: Prisma.SongFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SongPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SongFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SongPayload>
          }
          findMany: {
            args: Prisma.SongFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SongPayload>[]
          }
          create: {
            args: Prisma.SongCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SongPayload>
          }
          createMany: {
            args: Prisma.SongCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SongCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SongPayload>[]
          }
          delete: {
            args: Prisma.SongDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SongPayload>
          }
          update: {
            args: Prisma.SongUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SongPayload>
          }
          deleteMany: {
            args: Prisma.SongDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SongUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SongUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SongPayload>
          }
          aggregate: {
            args: Prisma.SongAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSong>
          }
          groupBy: {
            args: Prisma.SongGroupByArgs<ExtArgs>
            result: $Utils.Optional<SongGroupByOutputType>[]
          }
          count: {
            args: Prisma.SongCountArgs<ExtArgs>
            result: $Utils.Optional<SongCountAggregateOutputType> | number
          }
        }
      }
      Setlist: {
        payload: Prisma.$SetlistPayload<ExtArgs>
        fields: Prisma.SetlistFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SetlistFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SetlistFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistPayload>
          }
          findFirst: {
            args: Prisma.SetlistFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SetlistFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistPayload>
          }
          findMany: {
            args: Prisma.SetlistFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistPayload>[]
          }
          create: {
            args: Prisma.SetlistCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistPayload>
          }
          createMany: {
            args: Prisma.SetlistCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SetlistCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistPayload>[]
          }
          delete: {
            args: Prisma.SetlistDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistPayload>
          }
          update: {
            args: Prisma.SetlistUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistPayload>
          }
          deleteMany: {
            args: Prisma.SetlistDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SetlistUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SetlistUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistPayload>
          }
          aggregate: {
            args: Prisma.SetlistAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSetlist>
          }
          groupBy: {
            args: Prisma.SetlistGroupByArgs<ExtArgs>
            result: $Utils.Optional<SetlistGroupByOutputType>[]
          }
          count: {
            args: Prisma.SetlistCountArgs<ExtArgs>
            result: $Utils.Optional<SetlistCountAggregateOutputType> | number
          }
        }
      }
      SetlistSong: {
        payload: Prisma.$SetlistSongPayload<ExtArgs>
        fields: Prisma.SetlistSongFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SetlistSongFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistSongPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SetlistSongFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistSongPayload>
          }
          findFirst: {
            args: Prisma.SetlistSongFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistSongPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SetlistSongFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistSongPayload>
          }
          findMany: {
            args: Prisma.SetlistSongFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistSongPayload>[]
          }
          create: {
            args: Prisma.SetlistSongCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistSongPayload>
          }
          createMany: {
            args: Prisma.SetlistSongCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SetlistSongCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistSongPayload>[]
          }
          delete: {
            args: Prisma.SetlistSongDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistSongPayload>
          }
          update: {
            args: Prisma.SetlistSongUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistSongPayload>
          }
          deleteMany: {
            args: Prisma.SetlistSongDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SetlistSongUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SetlistSongUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SetlistSongPayload>
          }
          aggregate: {
            args: Prisma.SetlistSongAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSetlistSong>
          }
          groupBy: {
            args: Prisma.SetlistSongGroupByArgs<ExtArgs>
            result: $Utils.Optional<SetlistSongGroupByOutputType>[]
          }
          count: {
            args: Prisma.SetlistSongCountArgs<ExtArgs>
            result: $Utils.Optional<SetlistSongCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Vote: {
        payload: Prisma.$VotePayload<ExtArgs>
        fields: Prisma.VoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          findFirst: {
            args: Prisma.VoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          findMany: {
            args: Prisma.VoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>[]
          }
          create: {
            args: Prisma.VoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          createMany: {
            args: Prisma.VoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VoteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>[]
          }
          delete: {
            args: Prisma.VoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          update: {
            args: Prisma.VoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          deleteMany: {
            args: Prisma.VoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.VoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          aggregate: {
            args: Prisma.VoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVote>
          }
          groupBy: {
            args: Prisma.VoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<VoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.VoteCountArgs<ExtArgs>
            result: $Utils.Optional<VoteCountAggregateOutputType> | number
          }
        }
      }
      VoteAnalytics: {
        payload: Prisma.$VoteAnalyticsPayload<ExtArgs>
        fields: Prisma.VoteAnalyticsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VoteAnalyticsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoteAnalyticsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VoteAnalyticsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoteAnalyticsPayload>
          }
          findFirst: {
            args: Prisma.VoteAnalyticsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoteAnalyticsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VoteAnalyticsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoteAnalyticsPayload>
          }
          findMany: {
            args: Prisma.VoteAnalyticsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoteAnalyticsPayload>[]
          }
          create: {
            args: Prisma.VoteAnalyticsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoteAnalyticsPayload>
          }
          createMany: {
            args: Prisma.VoteAnalyticsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VoteAnalyticsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoteAnalyticsPayload>[]
          }
          delete: {
            args: Prisma.VoteAnalyticsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoteAnalyticsPayload>
          }
          update: {
            args: Prisma.VoteAnalyticsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoteAnalyticsPayload>
          }
          deleteMany: {
            args: Prisma.VoteAnalyticsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VoteAnalyticsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.VoteAnalyticsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoteAnalyticsPayload>
          }
          aggregate: {
            args: Prisma.VoteAnalyticsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVoteAnalytics>
          }
          groupBy: {
            args: Prisma.VoteAnalyticsGroupByArgs<ExtArgs>
            result: $Utils.Optional<VoteAnalyticsGroupByOutputType>[]
          }
          count: {
            args: Prisma.VoteAnalyticsCountArgs<ExtArgs>
            result: $Utils.Optional<VoteAnalyticsCountAggregateOutputType> | number
          }
        }
      }
      SyncHistory: {
        payload: Prisma.$SyncHistoryPayload<ExtArgs>
        fields: Prisma.SyncHistoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SyncHistoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncHistoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SyncHistoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncHistoryPayload>
          }
          findFirst: {
            args: Prisma.SyncHistoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncHistoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SyncHistoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncHistoryPayload>
          }
          findMany: {
            args: Prisma.SyncHistoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncHistoryPayload>[]
          }
          create: {
            args: Prisma.SyncHistoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncHistoryPayload>
          }
          createMany: {
            args: Prisma.SyncHistoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SyncHistoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncHistoryPayload>[]
          }
          delete: {
            args: Prisma.SyncHistoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncHistoryPayload>
          }
          update: {
            args: Prisma.SyncHistoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncHistoryPayload>
          }
          deleteMany: {
            args: Prisma.SyncHistoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SyncHistoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SyncHistoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncHistoryPayload>
          }
          aggregate: {
            args: Prisma.SyncHistoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSyncHistory>
          }
          groupBy: {
            args: Prisma.SyncHistoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<SyncHistoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.SyncHistoryCountArgs<ExtArgs>
            result: $Utils.Optional<SyncHistoryCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ArtistCountOutputType
   */

  export type ArtistCountOutputType = {
    shows: number
    songs: number
  }

  export type ArtistCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shows?: boolean | ArtistCountOutputTypeCountShowsArgs
    songs?: boolean | ArtistCountOutputTypeCountSongsArgs
  }

  // Custom InputTypes
  /**
   * ArtistCountOutputType without action
   */
  export type ArtistCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtistCountOutputType
     */
    select?: ArtistCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ArtistCountOutputType without action
   */
  export type ArtistCountOutputTypeCountShowsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ShowWhereInput
  }

  /**
   * ArtistCountOutputType without action
   */
  export type ArtistCountOutputTypeCountSongsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SongWhereInput
  }


  /**
   * Count Type VenueCountOutputType
   */

  export type VenueCountOutputType = {
    shows: number
  }

  export type VenueCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shows?: boolean | VenueCountOutputTypeCountShowsArgs
  }

  // Custom InputTypes
  /**
   * VenueCountOutputType without action
   */
  export type VenueCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VenueCountOutputType
     */
    select?: VenueCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * VenueCountOutputType without action
   */
  export type VenueCountOutputTypeCountShowsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ShowWhereInput
  }


  /**
   * Count Type ShowCountOutputType
   */

  export type ShowCountOutputType = {
    setlists: number
    votes: number
    voteAnalytics: number
  }

  export type ShowCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    setlists?: boolean | ShowCountOutputTypeCountSetlistsArgs
    votes?: boolean | ShowCountOutputTypeCountVotesArgs
    voteAnalytics?: boolean | ShowCountOutputTypeCountVoteAnalyticsArgs
  }

  // Custom InputTypes
  /**
   * ShowCountOutputType without action
   */
  export type ShowCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShowCountOutputType
     */
    select?: ShowCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ShowCountOutputType without action
   */
  export type ShowCountOutputTypeCountSetlistsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SetlistWhereInput
  }

  /**
   * ShowCountOutputType without action
   */
  export type ShowCountOutputTypeCountVotesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VoteWhereInput
  }

  /**
   * ShowCountOutputType without action
   */
  export type ShowCountOutputTypeCountVoteAnalyticsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VoteAnalyticsWhereInput
  }


  /**
   * Count Type SongCountOutputType
   */

  export type SongCountOutputType = {
    setlistSongs: number
  }

  export type SongCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    setlistSongs?: boolean | SongCountOutputTypeCountSetlistSongsArgs
  }

  // Custom InputTypes
  /**
   * SongCountOutputType without action
   */
  export type SongCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SongCountOutputType
     */
    select?: SongCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SongCountOutputType without action
   */
  export type SongCountOutputTypeCountSetlistSongsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SetlistSongWhereInput
  }


  /**
   * Count Type SetlistCountOutputType
   */

  export type SetlistCountOutputType = {
    setlistSongs: number
  }

  export type SetlistCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    setlistSongs?: boolean | SetlistCountOutputTypeCountSetlistSongsArgs
  }

  // Custom InputTypes
  /**
   * SetlistCountOutputType without action
   */
  export type SetlistCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistCountOutputType
     */
    select?: SetlistCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SetlistCountOutputType without action
   */
  export type SetlistCountOutputTypeCountSetlistSongsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SetlistSongWhereInput
  }


  /**
   * Count Type SetlistSongCountOutputType
   */

  export type SetlistSongCountOutputType = {
    votes: number
  }

  export type SetlistSongCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    votes?: boolean | SetlistSongCountOutputTypeCountVotesArgs
  }

  // Custom InputTypes
  /**
   * SetlistSongCountOutputType without action
   */
  export type SetlistSongCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSongCountOutputType
     */
    select?: SetlistSongCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SetlistSongCountOutputType without action
   */
  export type SetlistSongCountOutputTypeCountVotesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VoteWhereInput
  }


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    votes: number
    voteAnalytics: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    votes?: boolean | UserCountOutputTypeCountVotesArgs
    voteAnalytics?: boolean | UserCountOutputTypeCountVoteAnalyticsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountVotesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VoteWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountVoteAnalyticsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VoteAnalyticsWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Artist
   */

  export type AggregateArtist = {
    _count: ArtistCountAggregateOutputType | null
    _avg: ArtistAvgAggregateOutputType | null
    _sum: ArtistSumAggregateOutputType | null
    _min: ArtistMinAggregateOutputType | null
    _max: ArtistMaxAggregateOutputType | null
  }

  export type ArtistAvgAggregateOutputType = {
    popularity: number | null
    followers: number | null
  }

  export type ArtistSumAggregateOutputType = {
    popularity: number | null
    followers: number | null
  }

  export type ArtistMinAggregateOutputType = {
    id: string | null
    spotifyId: string | null
    ticketmasterId: string | null
    setlistfmMbid: string | null
    name: string | null
    slug: string | null
    imageUrl: string | null
    popularity: number | null
    followers: number | null
    lastSyncedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ArtistMaxAggregateOutputType = {
    id: string | null
    spotifyId: string | null
    ticketmasterId: string | null
    setlistfmMbid: string | null
    name: string | null
    slug: string | null
    imageUrl: string | null
    popularity: number | null
    followers: number | null
    lastSyncedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ArtistCountAggregateOutputType = {
    id: number
    spotifyId: number
    ticketmasterId: number
    setlistfmMbid: number
    name: number
    slug: number
    imageUrl: number
    genres: number
    popularity: number
    followers: number
    lastSyncedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ArtistAvgAggregateInputType = {
    popularity?: true
    followers?: true
  }

  export type ArtistSumAggregateInputType = {
    popularity?: true
    followers?: true
  }

  export type ArtistMinAggregateInputType = {
    id?: true
    spotifyId?: true
    ticketmasterId?: true
    setlistfmMbid?: true
    name?: true
    slug?: true
    imageUrl?: true
    popularity?: true
    followers?: true
    lastSyncedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ArtistMaxAggregateInputType = {
    id?: true
    spotifyId?: true
    ticketmasterId?: true
    setlistfmMbid?: true
    name?: true
    slug?: true
    imageUrl?: true
    popularity?: true
    followers?: true
    lastSyncedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ArtistCountAggregateInputType = {
    id?: true
    spotifyId?: true
    ticketmasterId?: true
    setlistfmMbid?: true
    name?: true
    slug?: true
    imageUrl?: true
    genres?: true
    popularity?: true
    followers?: true
    lastSyncedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ArtistAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Artist to aggregate.
     */
    where?: ArtistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artists to fetch.
     */
    orderBy?: ArtistOrderByWithRelationInput | ArtistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ArtistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Artists
    **/
    _count?: true | ArtistCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ArtistAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ArtistSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ArtistMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ArtistMaxAggregateInputType
  }

  export type GetArtistAggregateType<T extends ArtistAggregateArgs> = {
        [P in keyof T & keyof AggregateArtist]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateArtist[P]>
      : GetScalarType<T[P], AggregateArtist[P]>
  }




  export type ArtistGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtistWhereInput
    orderBy?: ArtistOrderByWithAggregationInput | ArtistOrderByWithAggregationInput[]
    by: ArtistScalarFieldEnum[] | ArtistScalarFieldEnum
    having?: ArtistScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ArtistCountAggregateInputType | true
    _avg?: ArtistAvgAggregateInputType
    _sum?: ArtistSumAggregateInputType
    _min?: ArtistMinAggregateInputType
    _max?: ArtistMaxAggregateInputType
  }

  export type ArtistGroupByOutputType = {
    id: string
    spotifyId: string | null
    ticketmasterId: string | null
    setlistfmMbid: string | null
    name: string
    slug: string
    imageUrl: string | null
    genres: string[]
    popularity: number
    followers: number
    lastSyncedAt: Date
    createdAt: Date
    updatedAt: Date
    _count: ArtistCountAggregateOutputType | null
    _avg: ArtistAvgAggregateOutputType | null
    _sum: ArtistSumAggregateOutputType | null
    _min: ArtistMinAggregateOutputType | null
    _max: ArtistMaxAggregateOutputType | null
  }

  type GetArtistGroupByPayload<T extends ArtistGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ArtistGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ArtistGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ArtistGroupByOutputType[P]>
            : GetScalarType<T[P], ArtistGroupByOutputType[P]>
        }
      >
    >


  export type ArtistSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spotifyId?: boolean
    ticketmasterId?: boolean
    setlistfmMbid?: boolean
    name?: boolean
    slug?: boolean
    imageUrl?: boolean
    genres?: boolean
    popularity?: boolean
    followers?: boolean
    lastSyncedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shows?: boolean | Artist$showsArgs<ExtArgs>
    songs?: boolean | Artist$songsArgs<ExtArgs>
    _count?: boolean | ArtistCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["artist"]>

  export type ArtistSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spotifyId?: boolean
    ticketmasterId?: boolean
    setlistfmMbid?: boolean
    name?: boolean
    slug?: boolean
    imageUrl?: boolean
    genres?: boolean
    popularity?: boolean
    followers?: boolean
    lastSyncedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["artist"]>

  export type ArtistSelectScalar = {
    id?: boolean
    spotifyId?: boolean
    ticketmasterId?: boolean
    setlistfmMbid?: boolean
    name?: boolean
    slug?: boolean
    imageUrl?: boolean
    genres?: boolean
    popularity?: boolean
    followers?: boolean
    lastSyncedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ArtistInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shows?: boolean | Artist$showsArgs<ExtArgs>
    songs?: boolean | Artist$songsArgs<ExtArgs>
    _count?: boolean | ArtistCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ArtistIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ArtistPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Artist"
    objects: {
      shows: Prisma.$ShowPayload<ExtArgs>[]
      songs: Prisma.$SongPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      spotifyId: string | null
      ticketmasterId: string | null
      setlistfmMbid: string | null
      name: string
      slug: string
      imageUrl: string | null
      genres: string[]
      popularity: number
      followers: number
      lastSyncedAt: Date
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["artist"]>
    composites: {}
  }

  type ArtistGetPayload<S extends boolean | null | undefined | ArtistDefaultArgs> = $Result.GetResult<Prisma.$ArtistPayload, S>

  type ArtistCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ArtistFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ArtistCountAggregateInputType | true
    }

  export interface ArtistDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Artist'], meta: { name: 'Artist' } }
    /**
     * Find zero or one Artist that matches the filter.
     * @param {ArtistFindUniqueArgs} args - Arguments to find a Artist
     * @example
     * // Get one Artist
     * const artist = await prisma.artist.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ArtistFindUniqueArgs>(args: SelectSubset<T, ArtistFindUniqueArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Artist that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ArtistFindUniqueOrThrowArgs} args - Arguments to find a Artist
     * @example
     * // Get one Artist
     * const artist = await prisma.artist.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ArtistFindUniqueOrThrowArgs>(args: SelectSubset<T, ArtistFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Artist that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistFindFirstArgs} args - Arguments to find a Artist
     * @example
     * // Get one Artist
     * const artist = await prisma.artist.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ArtistFindFirstArgs>(args?: SelectSubset<T, ArtistFindFirstArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Artist that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistFindFirstOrThrowArgs} args - Arguments to find a Artist
     * @example
     * // Get one Artist
     * const artist = await prisma.artist.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ArtistFindFirstOrThrowArgs>(args?: SelectSubset<T, ArtistFindFirstOrThrowArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Artists that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Artists
     * const artists = await prisma.artist.findMany()
     * 
     * // Get first 10 Artists
     * const artists = await prisma.artist.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const artistWithIdOnly = await prisma.artist.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ArtistFindManyArgs>(args?: SelectSubset<T, ArtistFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Artist.
     * @param {ArtistCreateArgs} args - Arguments to create a Artist.
     * @example
     * // Create one Artist
     * const Artist = await prisma.artist.create({
     *   data: {
     *     // ... data to create a Artist
     *   }
     * })
     * 
     */
    create<T extends ArtistCreateArgs>(args: SelectSubset<T, ArtistCreateArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Artists.
     * @param {ArtistCreateManyArgs} args - Arguments to create many Artists.
     * @example
     * // Create many Artists
     * const artist = await prisma.artist.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ArtistCreateManyArgs>(args?: SelectSubset<T, ArtistCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Artists and returns the data saved in the database.
     * @param {ArtistCreateManyAndReturnArgs} args - Arguments to create many Artists.
     * @example
     * // Create many Artists
     * const artist = await prisma.artist.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Artists and only return the `id`
     * const artistWithIdOnly = await prisma.artist.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ArtistCreateManyAndReturnArgs>(args?: SelectSubset<T, ArtistCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Artist.
     * @param {ArtistDeleteArgs} args - Arguments to delete one Artist.
     * @example
     * // Delete one Artist
     * const Artist = await prisma.artist.delete({
     *   where: {
     *     // ... filter to delete one Artist
     *   }
     * })
     * 
     */
    delete<T extends ArtistDeleteArgs>(args: SelectSubset<T, ArtistDeleteArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Artist.
     * @param {ArtistUpdateArgs} args - Arguments to update one Artist.
     * @example
     * // Update one Artist
     * const artist = await prisma.artist.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ArtistUpdateArgs>(args: SelectSubset<T, ArtistUpdateArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Artists.
     * @param {ArtistDeleteManyArgs} args - Arguments to filter Artists to delete.
     * @example
     * // Delete a few Artists
     * const { count } = await prisma.artist.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ArtistDeleteManyArgs>(args?: SelectSubset<T, ArtistDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Artists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Artists
     * const artist = await prisma.artist.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ArtistUpdateManyArgs>(args: SelectSubset<T, ArtistUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Artist.
     * @param {ArtistUpsertArgs} args - Arguments to update or create a Artist.
     * @example
     * // Update or create a Artist
     * const artist = await prisma.artist.upsert({
     *   create: {
     *     // ... data to create a Artist
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Artist we want to update
     *   }
     * })
     */
    upsert<T extends ArtistUpsertArgs>(args: SelectSubset<T, ArtistUpsertArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Artists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistCountArgs} args - Arguments to filter Artists to count.
     * @example
     * // Count the number of Artists
     * const count = await prisma.artist.count({
     *   where: {
     *     // ... the filter for the Artists we want to count
     *   }
     * })
    **/
    count<T extends ArtistCountArgs>(
      args?: Subset<T, ArtistCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ArtistCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Artist.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ArtistAggregateArgs>(args: Subset<T, ArtistAggregateArgs>): Prisma.PrismaPromise<GetArtistAggregateType<T>>

    /**
     * Group by Artist.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ArtistGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ArtistGroupByArgs['orderBy'] }
        : { orderBy?: ArtistGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ArtistGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetArtistGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Artist model
   */
  readonly fields: ArtistFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Artist.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ArtistClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    shows<T extends Artist$showsArgs<ExtArgs> = {}>(args?: Subset<T, Artist$showsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "findMany"> | Null>
    songs<T extends Artist$songsArgs<ExtArgs> = {}>(args?: Subset<T, Artist$songsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Artist model
   */ 
  interface ArtistFieldRefs {
    readonly id: FieldRef<"Artist", 'String'>
    readonly spotifyId: FieldRef<"Artist", 'String'>
    readonly ticketmasterId: FieldRef<"Artist", 'String'>
    readonly setlistfmMbid: FieldRef<"Artist", 'String'>
    readonly name: FieldRef<"Artist", 'String'>
    readonly slug: FieldRef<"Artist", 'String'>
    readonly imageUrl: FieldRef<"Artist", 'String'>
    readonly genres: FieldRef<"Artist", 'String[]'>
    readonly popularity: FieldRef<"Artist", 'Int'>
    readonly followers: FieldRef<"Artist", 'Int'>
    readonly lastSyncedAt: FieldRef<"Artist", 'DateTime'>
    readonly createdAt: FieldRef<"Artist", 'DateTime'>
    readonly updatedAt: FieldRef<"Artist", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Artist findUnique
   */
  export type ArtistFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter, which Artist to fetch.
     */
    where: ArtistWhereUniqueInput
  }

  /**
   * Artist findUniqueOrThrow
   */
  export type ArtistFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter, which Artist to fetch.
     */
    where: ArtistWhereUniqueInput
  }

  /**
   * Artist findFirst
   */
  export type ArtistFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter, which Artist to fetch.
     */
    where?: ArtistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artists to fetch.
     */
    orderBy?: ArtistOrderByWithRelationInput | ArtistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Artists.
     */
    cursor?: ArtistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Artists.
     */
    distinct?: ArtistScalarFieldEnum | ArtistScalarFieldEnum[]
  }

  /**
   * Artist findFirstOrThrow
   */
  export type ArtistFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter, which Artist to fetch.
     */
    where?: ArtistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artists to fetch.
     */
    orderBy?: ArtistOrderByWithRelationInput | ArtistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Artists.
     */
    cursor?: ArtistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Artists.
     */
    distinct?: ArtistScalarFieldEnum | ArtistScalarFieldEnum[]
  }

  /**
   * Artist findMany
   */
  export type ArtistFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter, which Artists to fetch.
     */
    where?: ArtistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artists to fetch.
     */
    orderBy?: ArtistOrderByWithRelationInput | ArtistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Artists.
     */
    cursor?: ArtistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artists.
     */
    skip?: number
    distinct?: ArtistScalarFieldEnum | ArtistScalarFieldEnum[]
  }

  /**
   * Artist create
   */
  export type ArtistCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * The data needed to create a Artist.
     */
    data: XOR<ArtistCreateInput, ArtistUncheckedCreateInput>
  }

  /**
   * Artist createMany
   */
  export type ArtistCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Artists.
     */
    data: ArtistCreateManyInput | ArtistCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Artist createManyAndReturn
   */
  export type ArtistCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Artists.
     */
    data: ArtistCreateManyInput | ArtistCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Artist update
   */
  export type ArtistUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * The data needed to update a Artist.
     */
    data: XOR<ArtistUpdateInput, ArtistUncheckedUpdateInput>
    /**
     * Choose, which Artist to update.
     */
    where: ArtistWhereUniqueInput
  }

  /**
   * Artist updateMany
   */
  export type ArtistUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Artists.
     */
    data: XOR<ArtistUpdateManyMutationInput, ArtistUncheckedUpdateManyInput>
    /**
     * Filter which Artists to update
     */
    where?: ArtistWhereInput
  }

  /**
   * Artist upsert
   */
  export type ArtistUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * The filter to search for the Artist to update in case it exists.
     */
    where: ArtistWhereUniqueInput
    /**
     * In case the Artist found by the `where` argument doesn't exist, create a new Artist with this data.
     */
    create: XOR<ArtistCreateInput, ArtistUncheckedCreateInput>
    /**
     * In case the Artist was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ArtistUpdateInput, ArtistUncheckedUpdateInput>
  }

  /**
   * Artist delete
   */
  export type ArtistDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter which Artist to delete.
     */
    where: ArtistWhereUniqueInput
  }

  /**
   * Artist deleteMany
   */
  export type ArtistDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Artists to delete
     */
    where?: ArtistWhereInput
  }

  /**
   * Artist.shows
   */
  export type Artist$showsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
    where?: ShowWhereInput
    orderBy?: ShowOrderByWithRelationInput | ShowOrderByWithRelationInput[]
    cursor?: ShowWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ShowScalarFieldEnum | ShowScalarFieldEnum[]
  }

  /**
   * Artist.songs
   */
  export type Artist$songsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongInclude<ExtArgs> | null
    where?: SongWhereInput
    orderBy?: SongOrderByWithRelationInput | SongOrderByWithRelationInput[]
    cursor?: SongWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SongScalarFieldEnum | SongScalarFieldEnum[]
  }

  /**
   * Artist without action
   */
  export type ArtistDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
  }


  /**
   * Model Venue
   */

  export type AggregateVenue = {
    _count: VenueCountAggregateOutputType | null
    _avg: VenueAvgAggregateOutputType | null
    _sum: VenueSumAggregateOutputType | null
    _min: VenueMinAggregateOutputType | null
    _max: VenueMaxAggregateOutputType | null
  }

  export type VenueAvgAggregateOutputType = {
    latitude: Decimal | null
    longitude: Decimal | null
    capacity: number | null
  }

  export type VenueSumAggregateOutputType = {
    latitude: Decimal | null
    longitude: Decimal | null
    capacity: number | null
  }

  export type VenueMinAggregateOutputType = {
    id: string | null
    ticketmasterId: string | null
    setlistfmId: string | null
    name: string | null
    address: string | null
    city: string | null
    state: string | null
    country: string | null
    postalCode: string | null
    latitude: Decimal | null
    longitude: Decimal | null
    timezone: string | null
    capacity: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VenueMaxAggregateOutputType = {
    id: string | null
    ticketmasterId: string | null
    setlistfmId: string | null
    name: string | null
    address: string | null
    city: string | null
    state: string | null
    country: string | null
    postalCode: string | null
    latitude: Decimal | null
    longitude: Decimal | null
    timezone: string | null
    capacity: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VenueCountAggregateOutputType = {
    id: number
    ticketmasterId: number
    setlistfmId: number
    name: number
    address: number
    city: number
    state: number
    country: number
    postalCode: number
    latitude: number
    longitude: number
    timezone: number
    capacity: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type VenueAvgAggregateInputType = {
    latitude?: true
    longitude?: true
    capacity?: true
  }

  export type VenueSumAggregateInputType = {
    latitude?: true
    longitude?: true
    capacity?: true
  }

  export type VenueMinAggregateInputType = {
    id?: true
    ticketmasterId?: true
    setlistfmId?: true
    name?: true
    address?: true
    city?: true
    state?: true
    country?: true
    postalCode?: true
    latitude?: true
    longitude?: true
    timezone?: true
    capacity?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VenueMaxAggregateInputType = {
    id?: true
    ticketmasterId?: true
    setlistfmId?: true
    name?: true
    address?: true
    city?: true
    state?: true
    country?: true
    postalCode?: true
    latitude?: true
    longitude?: true
    timezone?: true
    capacity?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VenueCountAggregateInputType = {
    id?: true
    ticketmasterId?: true
    setlistfmId?: true
    name?: true
    address?: true
    city?: true
    state?: true
    country?: true
    postalCode?: true
    latitude?: true
    longitude?: true
    timezone?: true
    capacity?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type VenueAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Venue to aggregate.
     */
    where?: VenueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Venues to fetch.
     */
    orderBy?: VenueOrderByWithRelationInput | VenueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VenueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Venues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Venues.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Venues
    **/
    _count?: true | VenueCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: VenueAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: VenueSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VenueMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VenueMaxAggregateInputType
  }

  export type GetVenueAggregateType<T extends VenueAggregateArgs> = {
        [P in keyof T & keyof AggregateVenue]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVenue[P]>
      : GetScalarType<T[P], AggregateVenue[P]>
  }




  export type VenueGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VenueWhereInput
    orderBy?: VenueOrderByWithAggregationInput | VenueOrderByWithAggregationInput[]
    by: VenueScalarFieldEnum[] | VenueScalarFieldEnum
    having?: VenueScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VenueCountAggregateInputType | true
    _avg?: VenueAvgAggregateInputType
    _sum?: VenueSumAggregateInputType
    _min?: VenueMinAggregateInputType
    _max?: VenueMaxAggregateInputType
  }

  export type VenueGroupByOutputType = {
    id: string
    ticketmasterId: string | null
    setlistfmId: string | null
    name: string
    address: string | null
    city: string
    state: string | null
    country: string
    postalCode: string | null
    latitude: Decimal | null
    longitude: Decimal | null
    timezone: string | null
    capacity: number | null
    createdAt: Date
    updatedAt: Date
    _count: VenueCountAggregateOutputType | null
    _avg: VenueAvgAggregateOutputType | null
    _sum: VenueSumAggregateOutputType | null
    _min: VenueMinAggregateOutputType | null
    _max: VenueMaxAggregateOutputType | null
  }

  type GetVenueGroupByPayload<T extends VenueGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VenueGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VenueGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VenueGroupByOutputType[P]>
            : GetScalarType<T[P], VenueGroupByOutputType[P]>
        }
      >
    >


  export type VenueSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketmasterId?: boolean
    setlistfmId?: boolean
    name?: boolean
    address?: boolean
    city?: boolean
    state?: boolean
    country?: boolean
    postalCode?: boolean
    latitude?: boolean
    longitude?: boolean
    timezone?: boolean
    capacity?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shows?: boolean | Venue$showsArgs<ExtArgs>
    _count?: boolean | VenueCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["venue"]>

  export type VenueSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketmasterId?: boolean
    setlistfmId?: boolean
    name?: boolean
    address?: boolean
    city?: boolean
    state?: boolean
    country?: boolean
    postalCode?: boolean
    latitude?: boolean
    longitude?: boolean
    timezone?: boolean
    capacity?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["venue"]>

  export type VenueSelectScalar = {
    id?: boolean
    ticketmasterId?: boolean
    setlistfmId?: boolean
    name?: boolean
    address?: boolean
    city?: boolean
    state?: boolean
    country?: boolean
    postalCode?: boolean
    latitude?: boolean
    longitude?: boolean
    timezone?: boolean
    capacity?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type VenueInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shows?: boolean | Venue$showsArgs<ExtArgs>
    _count?: boolean | VenueCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type VenueIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $VenuePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Venue"
    objects: {
      shows: Prisma.$ShowPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketmasterId: string | null
      setlistfmId: string | null
      name: string
      address: string | null
      city: string
      state: string | null
      country: string
      postalCode: string | null
      latitude: Prisma.Decimal | null
      longitude: Prisma.Decimal | null
      timezone: string | null
      capacity: number | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["venue"]>
    composites: {}
  }

  type VenueGetPayload<S extends boolean | null | undefined | VenueDefaultArgs> = $Result.GetResult<Prisma.$VenuePayload, S>

  type VenueCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<VenueFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: VenueCountAggregateInputType | true
    }

  export interface VenueDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Venue'], meta: { name: 'Venue' } }
    /**
     * Find zero or one Venue that matches the filter.
     * @param {VenueFindUniqueArgs} args - Arguments to find a Venue
     * @example
     * // Get one Venue
     * const venue = await prisma.venue.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VenueFindUniqueArgs>(args: SelectSubset<T, VenueFindUniqueArgs<ExtArgs>>): Prisma__VenueClient<$Result.GetResult<Prisma.$VenuePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Venue that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {VenueFindUniqueOrThrowArgs} args - Arguments to find a Venue
     * @example
     * // Get one Venue
     * const venue = await prisma.venue.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VenueFindUniqueOrThrowArgs>(args: SelectSubset<T, VenueFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VenueClient<$Result.GetResult<Prisma.$VenuePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Venue that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VenueFindFirstArgs} args - Arguments to find a Venue
     * @example
     * // Get one Venue
     * const venue = await prisma.venue.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VenueFindFirstArgs>(args?: SelectSubset<T, VenueFindFirstArgs<ExtArgs>>): Prisma__VenueClient<$Result.GetResult<Prisma.$VenuePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Venue that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VenueFindFirstOrThrowArgs} args - Arguments to find a Venue
     * @example
     * // Get one Venue
     * const venue = await prisma.venue.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VenueFindFirstOrThrowArgs>(args?: SelectSubset<T, VenueFindFirstOrThrowArgs<ExtArgs>>): Prisma__VenueClient<$Result.GetResult<Prisma.$VenuePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Venues that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VenueFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Venues
     * const venues = await prisma.venue.findMany()
     * 
     * // Get first 10 Venues
     * const venues = await prisma.venue.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const venueWithIdOnly = await prisma.venue.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VenueFindManyArgs>(args?: SelectSubset<T, VenueFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VenuePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Venue.
     * @param {VenueCreateArgs} args - Arguments to create a Venue.
     * @example
     * // Create one Venue
     * const Venue = await prisma.venue.create({
     *   data: {
     *     // ... data to create a Venue
     *   }
     * })
     * 
     */
    create<T extends VenueCreateArgs>(args: SelectSubset<T, VenueCreateArgs<ExtArgs>>): Prisma__VenueClient<$Result.GetResult<Prisma.$VenuePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Venues.
     * @param {VenueCreateManyArgs} args - Arguments to create many Venues.
     * @example
     * // Create many Venues
     * const venue = await prisma.venue.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VenueCreateManyArgs>(args?: SelectSubset<T, VenueCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Venues and returns the data saved in the database.
     * @param {VenueCreateManyAndReturnArgs} args - Arguments to create many Venues.
     * @example
     * // Create many Venues
     * const venue = await prisma.venue.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Venues and only return the `id`
     * const venueWithIdOnly = await prisma.venue.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VenueCreateManyAndReturnArgs>(args?: SelectSubset<T, VenueCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VenuePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Venue.
     * @param {VenueDeleteArgs} args - Arguments to delete one Venue.
     * @example
     * // Delete one Venue
     * const Venue = await prisma.venue.delete({
     *   where: {
     *     // ... filter to delete one Venue
     *   }
     * })
     * 
     */
    delete<T extends VenueDeleteArgs>(args: SelectSubset<T, VenueDeleteArgs<ExtArgs>>): Prisma__VenueClient<$Result.GetResult<Prisma.$VenuePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Venue.
     * @param {VenueUpdateArgs} args - Arguments to update one Venue.
     * @example
     * // Update one Venue
     * const venue = await prisma.venue.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VenueUpdateArgs>(args: SelectSubset<T, VenueUpdateArgs<ExtArgs>>): Prisma__VenueClient<$Result.GetResult<Prisma.$VenuePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Venues.
     * @param {VenueDeleteManyArgs} args - Arguments to filter Venues to delete.
     * @example
     * // Delete a few Venues
     * const { count } = await prisma.venue.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VenueDeleteManyArgs>(args?: SelectSubset<T, VenueDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Venues.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VenueUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Venues
     * const venue = await prisma.venue.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VenueUpdateManyArgs>(args: SelectSubset<T, VenueUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Venue.
     * @param {VenueUpsertArgs} args - Arguments to update or create a Venue.
     * @example
     * // Update or create a Venue
     * const venue = await prisma.venue.upsert({
     *   create: {
     *     // ... data to create a Venue
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Venue we want to update
     *   }
     * })
     */
    upsert<T extends VenueUpsertArgs>(args: SelectSubset<T, VenueUpsertArgs<ExtArgs>>): Prisma__VenueClient<$Result.GetResult<Prisma.$VenuePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Venues.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VenueCountArgs} args - Arguments to filter Venues to count.
     * @example
     * // Count the number of Venues
     * const count = await prisma.venue.count({
     *   where: {
     *     // ... the filter for the Venues we want to count
     *   }
     * })
    **/
    count<T extends VenueCountArgs>(
      args?: Subset<T, VenueCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VenueCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Venue.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VenueAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VenueAggregateArgs>(args: Subset<T, VenueAggregateArgs>): Prisma.PrismaPromise<GetVenueAggregateType<T>>

    /**
     * Group by Venue.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VenueGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VenueGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VenueGroupByArgs['orderBy'] }
        : { orderBy?: VenueGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VenueGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVenueGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Venue model
   */
  readonly fields: VenueFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Venue.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VenueClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    shows<T extends Venue$showsArgs<ExtArgs> = {}>(args?: Subset<T, Venue$showsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Venue model
   */ 
  interface VenueFieldRefs {
    readonly id: FieldRef<"Venue", 'String'>
    readonly ticketmasterId: FieldRef<"Venue", 'String'>
    readonly setlistfmId: FieldRef<"Venue", 'String'>
    readonly name: FieldRef<"Venue", 'String'>
    readonly address: FieldRef<"Venue", 'String'>
    readonly city: FieldRef<"Venue", 'String'>
    readonly state: FieldRef<"Venue", 'String'>
    readonly country: FieldRef<"Venue", 'String'>
    readonly postalCode: FieldRef<"Venue", 'String'>
    readonly latitude: FieldRef<"Venue", 'Decimal'>
    readonly longitude: FieldRef<"Venue", 'Decimal'>
    readonly timezone: FieldRef<"Venue", 'String'>
    readonly capacity: FieldRef<"Venue", 'Int'>
    readonly createdAt: FieldRef<"Venue", 'DateTime'>
    readonly updatedAt: FieldRef<"Venue", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Venue findUnique
   */
  export type VenueFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Venue
     */
    select?: VenueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VenueInclude<ExtArgs> | null
    /**
     * Filter, which Venue to fetch.
     */
    where: VenueWhereUniqueInput
  }

  /**
   * Venue findUniqueOrThrow
   */
  export type VenueFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Venue
     */
    select?: VenueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VenueInclude<ExtArgs> | null
    /**
     * Filter, which Venue to fetch.
     */
    where: VenueWhereUniqueInput
  }

  /**
   * Venue findFirst
   */
  export type VenueFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Venue
     */
    select?: VenueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VenueInclude<ExtArgs> | null
    /**
     * Filter, which Venue to fetch.
     */
    where?: VenueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Venues to fetch.
     */
    orderBy?: VenueOrderByWithRelationInput | VenueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Venues.
     */
    cursor?: VenueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Venues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Venues.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Venues.
     */
    distinct?: VenueScalarFieldEnum | VenueScalarFieldEnum[]
  }

  /**
   * Venue findFirstOrThrow
   */
  export type VenueFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Venue
     */
    select?: VenueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VenueInclude<ExtArgs> | null
    /**
     * Filter, which Venue to fetch.
     */
    where?: VenueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Venues to fetch.
     */
    orderBy?: VenueOrderByWithRelationInput | VenueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Venues.
     */
    cursor?: VenueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Venues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Venues.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Venues.
     */
    distinct?: VenueScalarFieldEnum | VenueScalarFieldEnum[]
  }

  /**
   * Venue findMany
   */
  export type VenueFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Venue
     */
    select?: VenueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VenueInclude<ExtArgs> | null
    /**
     * Filter, which Venues to fetch.
     */
    where?: VenueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Venues to fetch.
     */
    orderBy?: VenueOrderByWithRelationInput | VenueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Venues.
     */
    cursor?: VenueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Venues from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Venues.
     */
    skip?: number
    distinct?: VenueScalarFieldEnum | VenueScalarFieldEnum[]
  }

  /**
   * Venue create
   */
  export type VenueCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Venue
     */
    select?: VenueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VenueInclude<ExtArgs> | null
    /**
     * The data needed to create a Venue.
     */
    data: XOR<VenueCreateInput, VenueUncheckedCreateInput>
  }

  /**
   * Venue createMany
   */
  export type VenueCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Venues.
     */
    data: VenueCreateManyInput | VenueCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Venue createManyAndReturn
   */
  export type VenueCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Venue
     */
    select?: VenueSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Venues.
     */
    data: VenueCreateManyInput | VenueCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Venue update
   */
  export type VenueUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Venue
     */
    select?: VenueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VenueInclude<ExtArgs> | null
    /**
     * The data needed to update a Venue.
     */
    data: XOR<VenueUpdateInput, VenueUncheckedUpdateInput>
    /**
     * Choose, which Venue to update.
     */
    where: VenueWhereUniqueInput
  }

  /**
   * Venue updateMany
   */
  export type VenueUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Venues.
     */
    data: XOR<VenueUpdateManyMutationInput, VenueUncheckedUpdateManyInput>
    /**
     * Filter which Venues to update
     */
    where?: VenueWhereInput
  }

  /**
   * Venue upsert
   */
  export type VenueUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Venue
     */
    select?: VenueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VenueInclude<ExtArgs> | null
    /**
     * The filter to search for the Venue to update in case it exists.
     */
    where: VenueWhereUniqueInput
    /**
     * In case the Venue found by the `where` argument doesn't exist, create a new Venue with this data.
     */
    create: XOR<VenueCreateInput, VenueUncheckedCreateInput>
    /**
     * In case the Venue was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VenueUpdateInput, VenueUncheckedUpdateInput>
  }

  /**
   * Venue delete
   */
  export type VenueDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Venue
     */
    select?: VenueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VenueInclude<ExtArgs> | null
    /**
     * Filter which Venue to delete.
     */
    where: VenueWhereUniqueInput
  }

  /**
   * Venue deleteMany
   */
  export type VenueDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Venues to delete
     */
    where?: VenueWhereInput
  }

  /**
   * Venue.shows
   */
  export type Venue$showsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
    where?: ShowWhereInput
    orderBy?: ShowOrderByWithRelationInput | ShowOrderByWithRelationInput[]
    cursor?: ShowWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ShowScalarFieldEnum | ShowScalarFieldEnum[]
  }

  /**
   * Venue without action
   */
  export type VenueDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Venue
     */
    select?: VenueSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VenueInclude<ExtArgs> | null
  }


  /**
   * Model Show
   */

  export type AggregateShow = {
    _count: ShowCountAggregateOutputType | null
    _avg: ShowAvgAggregateOutputType | null
    _sum: ShowSumAggregateOutputType | null
    _min: ShowMinAggregateOutputType | null
    _max: ShowMaxAggregateOutputType | null
  }

  export type ShowAvgAggregateOutputType = {
    viewCount: number | null
  }

  export type ShowSumAggregateOutputType = {
    viewCount: number | null
  }

  export type ShowMinAggregateOutputType = {
    id: string | null
    artistId: string | null
    venueId: string | null
    ticketmasterId: string | null
    setlistfmId: string | null
    date: Date | null
    startTime: Date | null
    doorsTime: Date | null
    title: string | null
    tourName: string | null
    status: string | null
    ticketmasterUrl: string | null
    viewCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ShowMaxAggregateOutputType = {
    id: string | null
    artistId: string | null
    venueId: string | null
    ticketmasterId: string | null
    setlistfmId: string | null
    date: Date | null
    startTime: Date | null
    doorsTime: Date | null
    title: string | null
    tourName: string | null
    status: string | null
    ticketmasterUrl: string | null
    viewCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ShowCountAggregateOutputType = {
    id: number
    artistId: number
    venueId: number
    ticketmasterId: number
    setlistfmId: number
    date: number
    startTime: number
    doorsTime: number
    title: number
    tourName: number
    status: number
    ticketmasterUrl: number
    viewCount: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ShowAvgAggregateInputType = {
    viewCount?: true
  }

  export type ShowSumAggregateInputType = {
    viewCount?: true
  }

  export type ShowMinAggregateInputType = {
    id?: true
    artistId?: true
    venueId?: true
    ticketmasterId?: true
    setlistfmId?: true
    date?: true
    startTime?: true
    doorsTime?: true
    title?: true
    tourName?: true
    status?: true
    ticketmasterUrl?: true
    viewCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ShowMaxAggregateInputType = {
    id?: true
    artistId?: true
    venueId?: true
    ticketmasterId?: true
    setlistfmId?: true
    date?: true
    startTime?: true
    doorsTime?: true
    title?: true
    tourName?: true
    status?: true
    ticketmasterUrl?: true
    viewCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ShowCountAggregateInputType = {
    id?: true
    artistId?: true
    venueId?: true
    ticketmasterId?: true
    setlistfmId?: true
    date?: true
    startTime?: true
    doorsTime?: true
    title?: true
    tourName?: true
    status?: true
    ticketmasterUrl?: true
    viewCount?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ShowAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Show to aggregate.
     */
    where?: ShowWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Shows to fetch.
     */
    orderBy?: ShowOrderByWithRelationInput | ShowOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ShowWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Shows from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Shows.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Shows
    **/
    _count?: true | ShowCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ShowAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ShowSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ShowMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ShowMaxAggregateInputType
  }

  export type GetShowAggregateType<T extends ShowAggregateArgs> = {
        [P in keyof T & keyof AggregateShow]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateShow[P]>
      : GetScalarType<T[P], AggregateShow[P]>
  }




  export type ShowGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ShowWhereInput
    orderBy?: ShowOrderByWithAggregationInput | ShowOrderByWithAggregationInput[]
    by: ShowScalarFieldEnum[] | ShowScalarFieldEnum
    having?: ShowScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ShowCountAggregateInputType | true
    _avg?: ShowAvgAggregateInputType
    _sum?: ShowSumAggregateInputType
    _min?: ShowMinAggregateInputType
    _max?: ShowMaxAggregateInputType
  }

  export type ShowGroupByOutputType = {
    id: string
    artistId: string
    venueId: string
    ticketmasterId: string | null
    setlistfmId: string | null
    date: Date
    startTime: Date | null
    doorsTime: Date | null
    title: string | null
    tourName: string | null
    status: string
    ticketmasterUrl: string | null
    viewCount: number
    createdAt: Date
    updatedAt: Date
    _count: ShowCountAggregateOutputType | null
    _avg: ShowAvgAggregateOutputType | null
    _sum: ShowSumAggregateOutputType | null
    _min: ShowMinAggregateOutputType | null
    _max: ShowMaxAggregateOutputType | null
  }

  type GetShowGroupByPayload<T extends ShowGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ShowGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ShowGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ShowGroupByOutputType[P]>
            : GetScalarType<T[P], ShowGroupByOutputType[P]>
        }
      >
    >


  export type ShowSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    artistId?: boolean
    venueId?: boolean
    ticketmasterId?: boolean
    setlistfmId?: boolean
    date?: boolean
    startTime?: boolean
    doorsTime?: boolean
    title?: boolean
    tourName?: boolean
    status?: boolean
    ticketmasterUrl?: boolean
    viewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    artist?: boolean | ArtistDefaultArgs<ExtArgs>
    venue?: boolean | VenueDefaultArgs<ExtArgs>
    setlists?: boolean | Show$setlistsArgs<ExtArgs>
    votes?: boolean | Show$votesArgs<ExtArgs>
    voteAnalytics?: boolean | Show$voteAnalyticsArgs<ExtArgs>
    _count?: boolean | ShowCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["show"]>

  export type ShowSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    artistId?: boolean
    venueId?: boolean
    ticketmasterId?: boolean
    setlistfmId?: boolean
    date?: boolean
    startTime?: boolean
    doorsTime?: boolean
    title?: boolean
    tourName?: boolean
    status?: boolean
    ticketmasterUrl?: boolean
    viewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    artist?: boolean | ArtistDefaultArgs<ExtArgs>
    venue?: boolean | VenueDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["show"]>

  export type ShowSelectScalar = {
    id?: boolean
    artistId?: boolean
    venueId?: boolean
    ticketmasterId?: boolean
    setlistfmId?: boolean
    date?: boolean
    startTime?: boolean
    doorsTime?: boolean
    title?: boolean
    tourName?: boolean
    status?: boolean
    ticketmasterUrl?: boolean
    viewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ShowInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artist?: boolean | ArtistDefaultArgs<ExtArgs>
    venue?: boolean | VenueDefaultArgs<ExtArgs>
    setlists?: boolean | Show$setlistsArgs<ExtArgs>
    votes?: boolean | Show$votesArgs<ExtArgs>
    voteAnalytics?: boolean | Show$voteAnalyticsArgs<ExtArgs>
    _count?: boolean | ShowCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ShowIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artist?: boolean | ArtistDefaultArgs<ExtArgs>
    venue?: boolean | VenueDefaultArgs<ExtArgs>
  }

  export type $ShowPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Show"
    objects: {
      artist: Prisma.$ArtistPayload<ExtArgs>
      venue: Prisma.$VenuePayload<ExtArgs>
      setlists: Prisma.$SetlistPayload<ExtArgs>[]
      votes: Prisma.$VotePayload<ExtArgs>[]
      voteAnalytics: Prisma.$VoteAnalyticsPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      artistId: string
      venueId: string
      ticketmasterId: string | null
      setlistfmId: string | null
      date: Date
      startTime: Date | null
      doorsTime: Date | null
      title: string | null
      tourName: string | null
      status: string
      ticketmasterUrl: string | null
      viewCount: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["show"]>
    composites: {}
  }

  type ShowGetPayload<S extends boolean | null | undefined | ShowDefaultArgs> = $Result.GetResult<Prisma.$ShowPayload, S>

  type ShowCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ShowFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ShowCountAggregateInputType | true
    }

  export interface ShowDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Show'], meta: { name: 'Show' } }
    /**
     * Find zero or one Show that matches the filter.
     * @param {ShowFindUniqueArgs} args - Arguments to find a Show
     * @example
     * // Get one Show
     * const show = await prisma.show.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ShowFindUniqueArgs>(args: SelectSubset<T, ShowFindUniqueArgs<ExtArgs>>): Prisma__ShowClient<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Show that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ShowFindUniqueOrThrowArgs} args - Arguments to find a Show
     * @example
     * // Get one Show
     * const show = await prisma.show.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ShowFindUniqueOrThrowArgs>(args: SelectSubset<T, ShowFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ShowClient<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Show that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShowFindFirstArgs} args - Arguments to find a Show
     * @example
     * // Get one Show
     * const show = await prisma.show.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ShowFindFirstArgs>(args?: SelectSubset<T, ShowFindFirstArgs<ExtArgs>>): Prisma__ShowClient<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Show that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShowFindFirstOrThrowArgs} args - Arguments to find a Show
     * @example
     * // Get one Show
     * const show = await prisma.show.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ShowFindFirstOrThrowArgs>(args?: SelectSubset<T, ShowFindFirstOrThrowArgs<ExtArgs>>): Prisma__ShowClient<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Shows that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShowFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Shows
     * const shows = await prisma.show.findMany()
     * 
     * // Get first 10 Shows
     * const shows = await prisma.show.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const showWithIdOnly = await prisma.show.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ShowFindManyArgs>(args?: SelectSubset<T, ShowFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Show.
     * @param {ShowCreateArgs} args - Arguments to create a Show.
     * @example
     * // Create one Show
     * const Show = await prisma.show.create({
     *   data: {
     *     // ... data to create a Show
     *   }
     * })
     * 
     */
    create<T extends ShowCreateArgs>(args: SelectSubset<T, ShowCreateArgs<ExtArgs>>): Prisma__ShowClient<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Shows.
     * @param {ShowCreateManyArgs} args - Arguments to create many Shows.
     * @example
     * // Create many Shows
     * const show = await prisma.show.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ShowCreateManyArgs>(args?: SelectSubset<T, ShowCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Shows and returns the data saved in the database.
     * @param {ShowCreateManyAndReturnArgs} args - Arguments to create many Shows.
     * @example
     * // Create many Shows
     * const show = await prisma.show.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Shows and only return the `id`
     * const showWithIdOnly = await prisma.show.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ShowCreateManyAndReturnArgs>(args?: SelectSubset<T, ShowCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Show.
     * @param {ShowDeleteArgs} args - Arguments to delete one Show.
     * @example
     * // Delete one Show
     * const Show = await prisma.show.delete({
     *   where: {
     *     // ... filter to delete one Show
     *   }
     * })
     * 
     */
    delete<T extends ShowDeleteArgs>(args: SelectSubset<T, ShowDeleteArgs<ExtArgs>>): Prisma__ShowClient<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Show.
     * @param {ShowUpdateArgs} args - Arguments to update one Show.
     * @example
     * // Update one Show
     * const show = await prisma.show.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ShowUpdateArgs>(args: SelectSubset<T, ShowUpdateArgs<ExtArgs>>): Prisma__ShowClient<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Shows.
     * @param {ShowDeleteManyArgs} args - Arguments to filter Shows to delete.
     * @example
     * // Delete a few Shows
     * const { count } = await prisma.show.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ShowDeleteManyArgs>(args?: SelectSubset<T, ShowDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Shows.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShowUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Shows
     * const show = await prisma.show.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ShowUpdateManyArgs>(args: SelectSubset<T, ShowUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Show.
     * @param {ShowUpsertArgs} args - Arguments to update or create a Show.
     * @example
     * // Update or create a Show
     * const show = await prisma.show.upsert({
     *   create: {
     *     // ... data to create a Show
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Show we want to update
     *   }
     * })
     */
    upsert<T extends ShowUpsertArgs>(args: SelectSubset<T, ShowUpsertArgs<ExtArgs>>): Prisma__ShowClient<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Shows.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShowCountArgs} args - Arguments to filter Shows to count.
     * @example
     * // Count the number of Shows
     * const count = await prisma.show.count({
     *   where: {
     *     // ... the filter for the Shows we want to count
     *   }
     * })
    **/
    count<T extends ShowCountArgs>(
      args?: Subset<T, ShowCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ShowCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Show.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShowAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ShowAggregateArgs>(args: Subset<T, ShowAggregateArgs>): Prisma.PrismaPromise<GetShowAggregateType<T>>

    /**
     * Group by Show.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShowGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ShowGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ShowGroupByArgs['orderBy'] }
        : { orderBy?: ShowGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ShowGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetShowGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Show model
   */
  readonly fields: ShowFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Show.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ShowClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    artist<T extends ArtistDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ArtistDefaultArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    venue<T extends VenueDefaultArgs<ExtArgs> = {}>(args?: Subset<T, VenueDefaultArgs<ExtArgs>>): Prisma__VenueClient<$Result.GetResult<Prisma.$VenuePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    setlists<T extends Show$setlistsArgs<ExtArgs> = {}>(args?: Subset<T, Show$setlistsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "findMany"> | Null>
    votes<T extends Show$votesArgs<ExtArgs> = {}>(args?: Subset<T, Show$votesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "findMany"> | Null>
    voteAnalytics<T extends Show$voteAnalyticsArgs<ExtArgs> = {}>(args?: Subset<T, Show$voteAnalyticsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Show model
   */ 
  interface ShowFieldRefs {
    readonly id: FieldRef<"Show", 'String'>
    readonly artistId: FieldRef<"Show", 'String'>
    readonly venueId: FieldRef<"Show", 'String'>
    readonly ticketmasterId: FieldRef<"Show", 'String'>
    readonly setlistfmId: FieldRef<"Show", 'String'>
    readonly date: FieldRef<"Show", 'DateTime'>
    readonly startTime: FieldRef<"Show", 'DateTime'>
    readonly doorsTime: FieldRef<"Show", 'DateTime'>
    readonly title: FieldRef<"Show", 'String'>
    readonly tourName: FieldRef<"Show", 'String'>
    readonly status: FieldRef<"Show", 'String'>
    readonly ticketmasterUrl: FieldRef<"Show", 'String'>
    readonly viewCount: FieldRef<"Show", 'Int'>
    readonly createdAt: FieldRef<"Show", 'DateTime'>
    readonly updatedAt: FieldRef<"Show", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Show findUnique
   */
  export type ShowFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
    /**
     * Filter, which Show to fetch.
     */
    where: ShowWhereUniqueInput
  }

  /**
   * Show findUniqueOrThrow
   */
  export type ShowFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
    /**
     * Filter, which Show to fetch.
     */
    where: ShowWhereUniqueInput
  }

  /**
   * Show findFirst
   */
  export type ShowFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
    /**
     * Filter, which Show to fetch.
     */
    where?: ShowWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Shows to fetch.
     */
    orderBy?: ShowOrderByWithRelationInput | ShowOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Shows.
     */
    cursor?: ShowWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Shows from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Shows.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Shows.
     */
    distinct?: ShowScalarFieldEnum | ShowScalarFieldEnum[]
  }

  /**
   * Show findFirstOrThrow
   */
  export type ShowFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
    /**
     * Filter, which Show to fetch.
     */
    where?: ShowWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Shows to fetch.
     */
    orderBy?: ShowOrderByWithRelationInput | ShowOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Shows.
     */
    cursor?: ShowWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Shows from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Shows.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Shows.
     */
    distinct?: ShowScalarFieldEnum | ShowScalarFieldEnum[]
  }

  /**
   * Show findMany
   */
  export type ShowFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
    /**
     * Filter, which Shows to fetch.
     */
    where?: ShowWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Shows to fetch.
     */
    orderBy?: ShowOrderByWithRelationInput | ShowOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Shows.
     */
    cursor?: ShowWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Shows from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Shows.
     */
    skip?: number
    distinct?: ShowScalarFieldEnum | ShowScalarFieldEnum[]
  }

  /**
   * Show create
   */
  export type ShowCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
    /**
     * The data needed to create a Show.
     */
    data: XOR<ShowCreateInput, ShowUncheckedCreateInput>
  }

  /**
   * Show createMany
   */
  export type ShowCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Shows.
     */
    data: ShowCreateManyInput | ShowCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Show createManyAndReturn
   */
  export type ShowCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Shows.
     */
    data: ShowCreateManyInput | ShowCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Show update
   */
  export type ShowUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
    /**
     * The data needed to update a Show.
     */
    data: XOR<ShowUpdateInput, ShowUncheckedUpdateInput>
    /**
     * Choose, which Show to update.
     */
    where: ShowWhereUniqueInput
  }

  /**
   * Show updateMany
   */
  export type ShowUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Shows.
     */
    data: XOR<ShowUpdateManyMutationInput, ShowUncheckedUpdateManyInput>
    /**
     * Filter which Shows to update
     */
    where?: ShowWhereInput
  }

  /**
   * Show upsert
   */
  export type ShowUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
    /**
     * The filter to search for the Show to update in case it exists.
     */
    where: ShowWhereUniqueInput
    /**
     * In case the Show found by the `where` argument doesn't exist, create a new Show with this data.
     */
    create: XOR<ShowCreateInput, ShowUncheckedCreateInput>
    /**
     * In case the Show was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ShowUpdateInput, ShowUncheckedUpdateInput>
  }

  /**
   * Show delete
   */
  export type ShowDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
    /**
     * Filter which Show to delete.
     */
    where: ShowWhereUniqueInput
  }

  /**
   * Show deleteMany
   */
  export type ShowDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Shows to delete
     */
    where?: ShowWhereInput
  }

  /**
   * Show.setlists
   */
  export type Show$setlistsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistInclude<ExtArgs> | null
    where?: SetlistWhereInput
    orderBy?: SetlistOrderByWithRelationInput | SetlistOrderByWithRelationInput[]
    cursor?: SetlistWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SetlistScalarFieldEnum | SetlistScalarFieldEnum[]
  }

  /**
   * Show.votes
   */
  export type Show$votesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    where?: VoteWhereInput
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    cursor?: VoteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VoteScalarFieldEnum | VoteScalarFieldEnum[]
  }

  /**
   * Show.voteAnalytics
   */
  export type Show$voteAnalyticsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
    where?: VoteAnalyticsWhereInput
    orderBy?: VoteAnalyticsOrderByWithRelationInput | VoteAnalyticsOrderByWithRelationInput[]
    cursor?: VoteAnalyticsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VoteAnalyticsScalarFieldEnum | VoteAnalyticsScalarFieldEnum[]
  }

  /**
   * Show without action
   */
  export type ShowDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Show
     */
    select?: ShowSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShowInclude<ExtArgs> | null
  }


  /**
   * Model Song
   */

  export type AggregateSong = {
    _count: SongCountAggregateOutputType | null
    _avg: SongAvgAggregateOutputType | null
    _sum: SongSumAggregateOutputType | null
    _min: SongMinAggregateOutputType | null
    _max: SongMaxAggregateOutputType | null
  }

  export type SongAvgAggregateOutputType = {
    durationMs: number | null
    popularity: number | null
  }

  export type SongSumAggregateOutputType = {
    durationMs: number | null
    popularity: number | null
  }

  export type SongMinAggregateOutputType = {
    id: string | null
    artistId: string | null
    spotifyId: string | null
    musicbrainzId: string | null
    title: string | null
    album: string | null
    albumImageUrl: string | null
    durationMs: number | null
    popularity: number | null
    previewUrl: string | null
    spotifyUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SongMaxAggregateOutputType = {
    id: string | null
    artistId: string | null
    spotifyId: string | null
    musicbrainzId: string | null
    title: string | null
    album: string | null
    albumImageUrl: string | null
    durationMs: number | null
    popularity: number | null
    previewUrl: string | null
    spotifyUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SongCountAggregateOutputType = {
    id: number
    artistId: number
    spotifyId: number
    musicbrainzId: number
    title: number
    album: number
    albumImageUrl: number
    durationMs: number
    popularity: number
    previewUrl: number
    spotifyUrl: number
    audioFeatures: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SongAvgAggregateInputType = {
    durationMs?: true
    popularity?: true
  }

  export type SongSumAggregateInputType = {
    durationMs?: true
    popularity?: true
  }

  export type SongMinAggregateInputType = {
    id?: true
    artistId?: true
    spotifyId?: true
    musicbrainzId?: true
    title?: true
    album?: true
    albumImageUrl?: true
    durationMs?: true
    popularity?: true
    previewUrl?: true
    spotifyUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SongMaxAggregateInputType = {
    id?: true
    artistId?: true
    spotifyId?: true
    musicbrainzId?: true
    title?: true
    album?: true
    albumImageUrl?: true
    durationMs?: true
    popularity?: true
    previewUrl?: true
    spotifyUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SongCountAggregateInputType = {
    id?: true
    artistId?: true
    spotifyId?: true
    musicbrainzId?: true
    title?: true
    album?: true
    albumImageUrl?: true
    durationMs?: true
    popularity?: true
    previewUrl?: true
    spotifyUrl?: true
    audioFeatures?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SongAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Song to aggregate.
     */
    where?: SongWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Songs to fetch.
     */
    orderBy?: SongOrderByWithRelationInput | SongOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SongWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Songs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Songs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Songs
    **/
    _count?: true | SongCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SongAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SongSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SongMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SongMaxAggregateInputType
  }

  export type GetSongAggregateType<T extends SongAggregateArgs> = {
        [P in keyof T & keyof AggregateSong]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSong[P]>
      : GetScalarType<T[P], AggregateSong[P]>
  }




  export type SongGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SongWhereInput
    orderBy?: SongOrderByWithAggregationInput | SongOrderByWithAggregationInput[]
    by: SongScalarFieldEnum[] | SongScalarFieldEnum
    having?: SongScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SongCountAggregateInputType | true
    _avg?: SongAvgAggregateInputType
    _sum?: SongSumAggregateInputType
    _min?: SongMinAggregateInputType
    _max?: SongMaxAggregateInputType
  }

  export type SongGroupByOutputType = {
    id: string
    artistId: string
    spotifyId: string | null
    musicbrainzId: string | null
    title: string
    album: string | null
    albumImageUrl: string | null
    durationMs: number | null
    popularity: number
    previewUrl: string | null
    spotifyUrl: string | null
    audioFeatures: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: SongCountAggregateOutputType | null
    _avg: SongAvgAggregateOutputType | null
    _sum: SongSumAggregateOutputType | null
    _min: SongMinAggregateOutputType | null
    _max: SongMaxAggregateOutputType | null
  }

  type GetSongGroupByPayload<T extends SongGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SongGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SongGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SongGroupByOutputType[P]>
            : GetScalarType<T[P], SongGroupByOutputType[P]>
        }
      >
    >


  export type SongSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    artistId?: boolean
    spotifyId?: boolean
    musicbrainzId?: boolean
    title?: boolean
    album?: boolean
    albumImageUrl?: boolean
    durationMs?: boolean
    popularity?: boolean
    previewUrl?: boolean
    spotifyUrl?: boolean
    audioFeatures?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    artist?: boolean | ArtistDefaultArgs<ExtArgs>
    setlistSongs?: boolean | Song$setlistSongsArgs<ExtArgs>
    _count?: boolean | SongCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["song"]>

  export type SongSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    artistId?: boolean
    spotifyId?: boolean
    musicbrainzId?: boolean
    title?: boolean
    album?: boolean
    albumImageUrl?: boolean
    durationMs?: boolean
    popularity?: boolean
    previewUrl?: boolean
    spotifyUrl?: boolean
    audioFeatures?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    artist?: boolean | ArtistDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["song"]>

  export type SongSelectScalar = {
    id?: boolean
    artistId?: boolean
    spotifyId?: boolean
    musicbrainzId?: boolean
    title?: boolean
    album?: boolean
    albumImageUrl?: boolean
    durationMs?: boolean
    popularity?: boolean
    previewUrl?: boolean
    spotifyUrl?: boolean
    audioFeatures?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SongInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artist?: boolean | ArtistDefaultArgs<ExtArgs>
    setlistSongs?: boolean | Song$setlistSongsArgs<ExtArgs>
    _count?: boolean | SongCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SongIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artist?: boolean | ArtistDefaultArgs<ExtArgs>
  }

  export type $SongPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Song"
    objects: {
      artist: Prisma.$ArtistPayload<ExtArgs>
      setlistSongs: Prisma.$SetlistSongPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      artistId: string
      spotifyId: string | null
      musicbrainzId: string | null
      title: string
      album: string | null
      albumImageUrl: string | null
      durationMs: number | null
      popularity: number
      previewUrl: string | null
      spotifyUrl: string | null
      audioFeatures: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["song"]>
    composites: {}
  }

  type SongGetPayload<S extends boolean | null | undefined | SongDefaultArgs> = $Result.GetResult<Prisma.$SongPayload, S>

  type SongCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SongFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SongCountAggregateInputType | true
    }

  export interface SongDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Song'], meta: { name: 'Song' } }
    /**
     * Find zero or one Song that matches the filter.
     * @param {SongFindUniqueArgs} args - Arguments to find a Song
     * @example
     * // Get one Song
     * const song = await prisma.song.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SongFindUniqueArgs>(args: SelectSubset<T, SongFindUniqueArgs<ExtArgs>>): Prisma__SongClient<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Song that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SongFindUniqueOrThrowArgs} args - Arguments to find a Song
     * @example
     * // Get one Song
     * const song = await prisma.song.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SongFindUniqueOrThrowArgs>(args: SelectSubset<T, SongFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SongClient<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Song that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SongFindFirstArgs} args - Arguments to find a Song
     * @example
     * // Get one Song
     * const song = await prisma.song.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SongFindFirstArgs>(args?: SelectSubset<T, SongFindFirstArgs<ExtArgs>>): Prisma__SongClient<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Song that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SongFindFirstOrThrowArgs} args - Arguments to find a Song
     * @example
     * // Get one Song
     * const song = await prisma.song.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SongFindFirstOrThrowArgs>(args?: SelectSubset<T, SongFindFirstOrThrowArgs<ExtArgs>>): Prisma__SongClient<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Songs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SongFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Songs
     * const songs = await prisma.song.findMany()
     * 
     * // Get first 10 Songs
     * const songs = await prisma.song.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const songWithIdOnly = await prisma.song.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SongFindManyArgs>(args?: SelectSubset<T, SongFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Song.
     * @param {SongCreateArgs} args - Arguments to create a Song.
     * @example
     * // Create one Song
     * const Song = await prisma.song.create({
     *   data: {
     *     // ... data to create a Song
     *   }
     * })
     * 
     */
    create<T extends SongCreateArgs>(args: SelectSubset<T, SongCreateArgs<ExtArgs>>): Prisma__SongClient<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Songs.
     * @param {SongCreateManyArgs} args - Arguments to create many Songs.
     * @example
     * // Create many Songs
     * const song = await prisma.song.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SongCreateManyArgs>(args?: SelectSubset<T, SongCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Songs and returns the data saved in the database.
     * @param {SongCreateManyAndReturnArgs} args - Arguments to create many Songs.
     * @example
     * // Create many Songs
     * const song = await prisma.song.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Songs and only return the `id`
     * const songWithIdOnly = await prisma.song.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SongCreateManyAndReturnArgs>(args?: SelectSubset<T, SongCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Song.
     * @param {SongDeleteArgs} args - Arguments to delete one Song.
     * @example
     * // Delete one Song
     * const Song = await prisma.song.delete({
     *   where: {
     *     // ... filter to delete one Song
     *   }
     * })
     * 
     */
    delete<T extends SongDeleteArgs>(args: SelectSubset<T, SongDeleteArgs<ExtArgs>>): Prisma__SongClient<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Song.
     * @param {SongUpdateArgs} args - Arguments to update one Song.
     * @example
     * // Update one Song
     * const song = await prisma.song.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SongUpdateArgs>(args: SelectSubset<T, SongUpdateArgs<ExtArgs>>): Prisma__SongClient<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Songs.
     * @param {SongDeleteManyArgs} args - Arguments to filter Songs to delete.
     * @example
     * // Delete a few Songs
     * const { count } = await prisma.song.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SongDeleteManyArgs>(args?: SelectSubset<T, SongDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Songs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SongUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Songs
     * const song = await prisma.song.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SongUpdateManyArgs>(args: SelectSubset<T, SongUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Song.
     * @param {SongUpsertArgs} args - Arguments to update or create a Song.
     * @example
     * // Update or create a Song
     * const song = await prisma.song.upsert({
     *   create: {
     *     // ... data to create a Song
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Song we want to update
     *   }
     * })
     */
    upsert<T extends SongUpsertArgs>(args: SelectSubset<T, SongUpsertArgs<ExtArgs>>): Prisma__SongClient<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Songs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SongCountArgs} args - Arguments to filter Songs to count.
     * @example
     * // Count the number of Songs
     * const count = await prisma.song.count({
     *   where: {
     *     // ... the filter for the Songs we want to count
     *   }
     * })
    **/
    count<T extends SongCountArgs>(
      args?: Subset<T, SongCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SongCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Song.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SongAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SongAggregateArgs>(args: Subset<T, SongAggregateArgs>): Prisma.PrismaPromise<GetSongAggregateType<T>>

    /**
     * Group by Song.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SongGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SongGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SongGroupByArgs['orderBy'] }
        : { orderBy?: SongGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SongGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSongGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Song model
   */
  readonly fields: SongFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Song.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SongClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    artist<T extends ArtistDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ArtistDefaultArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    setlistSongs<T extends Song$setlistSongsArgs<ExtArgs> = {}>(args?: Subset<T, Song$setlistSongsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Song model
   */ 
  interface SongFieldRefs {
    readonly id: FieldRef<"Song", 'String'>
    readonly artistId: FieldRef<"Song", 'String'>
    readonly spotifyId: FieldRef<"Song", 'String'>
    readonly musicbrainzId: FieldRef<"Song", 'String'>
    readonly title: FieldRef<"Song", 'String'>
    readonly album: FieldRef<"Song", 'String'>
    readonly albumImageUrl: FieldRef<"Song", 'String'>
    readonly durationMs: FieldRef<"Song", 'Int'>
    readonly popularity: FieldRef<"Song", 'Int'>
    readonly previewUrl: FieldRef<"Song", 'String'>
    readonly spotifyUrl: FieldRef<"Song", 'String'>
    readonly audioFeatures: FieldRef<"Song", 'Json'>
    readonly createdAt: FieldRef<"Song", 'DateTime'>
    readonly updatedAt: FieldRef<"Song", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Song findUnique
   */
  export type SongFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongInclude<ExtArgs> | null
    /**
     * Filter, which Song to fetch.
     */
    where: SongWhereUniqueInput
  }

  /**
   * Song findUniqueOrThrow
   */
  export type SongFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongInclude<ExtArgs> | null
    /**
     * Filter, which Song to fetch.
     */
    where: SongWhereUniqueInput
  }

  /**
   * Song findFirst
   */
  export type SongFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongInclude<ExtArgs> | null
    /**
     * Filter, which Song to fetch.
     */
    where?: SongWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Songs to fetch.
     */
    orderBy?: SongOrderByWithRelationInput | SongOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Songs.
     */
    cursor?: SongWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Songs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Songs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Songs.
     */
    distinct?: SongScalarFieldEnum | SongScalarFieldEnum[]
  }

  /**
   * Song findFirstOrThrow
   */
  export type SongFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongInclude<ExtArgs> | null
    /**
     * Filter, which Song to fetch.
     */
    where?: SongWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Songs to fetch.
     */
    orderBy?: SongOrderByWithRelationInput | SongOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Songs.
     */
    cursor?: SongWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Songs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Songs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Songs.
     */
    distinct?: SongScalarFieldEnum | SongScalarFieldEnum[]
  }

  /**
   * Song findMany
   */
  export type SongFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongInclude<ExtArgs> | null
    /**
     * Filter, which Songs to fetch.
     */
    where?: SongWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Songs to fetch.
     */
    orderBy?: SongOrderByWithRelationInput | SongOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Songs.
     */
    cursor?: SongWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Songs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Songs.
     */
    skip?: number
    distinct?: SongScalarFieldEnum | SongScalarFieldEnum[]
  }

  /**
   * Song create
   */
  export type SongCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongInclude<ExtArgs> | null
    /**
     * The data needed to create a Song.
     */
    data: XOR<SongCreateInput, SongUncheckedCreateInput>
  }

  /**
   * Song createMany
   */
  export type SongCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Songs.
     */
    data: SongCreateManyInput | SongCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Song createManyAndReturn
   */
  export type SongCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Songs.
     */
    data: SongCreateManyInput | SongCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Song update
   */
  export type SongUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongInclude<ExtArgs> | null
    /**
     * The data needed to update a Song.
     */
    data: XOR<SongUpdateInput, SongUncheckedUpdateInput>
    /**
     * Choose, which Song to update.
     */
    where: SongWhereUniqueInput
  }

  /**
   * Song updateMany
   */
  export type SongUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Songs.
     */
    data: XOR<SongUpdateManyMutationInput, SongUncheckedUpdateManyInput>
    /**
     * Filter which Songs to update
     */
    where?: SongWhereInput
  }

  /**
   * Song upsert
   */
  export type SongUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongInclude<ExtArgs> | null
    /**
     * The filter to search for the Song to update in case it exists.
     */
    where: SongWhereUniqueInput
    /**
     * In case the Song found by the `where` argument doesn't exist, create a new Song with this data.
     */
    create: XOR<SongCreateInput, SongUncheckedCreateInput>
    /**
     * In case the Song was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SongUpdateInput, SongUncheckedUpdateInput>
  }

  /**
   * Song delete
   */
  export type SongDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongInclude<ExtArgs> | null
    /**
     * Filter which Song to delete.
     */
    where: SongWhereUniqueInput
  }

  /**
   * Song deleteMany
   */
  export type SongDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Songs to delete
     */
    where?: SongWhereInput
  }

  /**
   * Song.setlistSongs
   */
  export type Song$setlistSongsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
    where?: SetlistSongWhereInput
    orderBy?: SetlistSongOrderByWithRelationInput | SetlistSongOrderByWithRelationInput[]
    cursor?: SetlistSongWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SetlistSongScalarFieldEnum | SetlistSongScalarFieldEnum[]
  }

  /**
   * Song without action
   */
  export type SongDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Song
     */
    select?: SongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SongInclude<ExtArgs> | null
  }


  /**
   * Model Setlist
   */

  export type AggregateSetlist = {
    _count: SetlistCountAggregateOutputType | null
    _avg: SetlistAvgAggregateOutputType | null
    _sum: SetlistSumAggregateOutputType | null
    _min: SetlistMinAggregateOutputType | null
    _max: SetlistMaxAggregateOutputType | null
  }

  export type SetlistAvgAggregateOutputType = {
    orderIndex: number | null
  }

  export type SetlistSumAggregateOutputType = {
    orderIndex: number | null
  }

  export type SetlistMinAggregateOutputType = {
    id: string | null
    showId: string | null
    name: string | null
    orderIndex: number | null
    isEncore: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SetlistMaxAggregateOutputType = {
    id: string | null
    showId: string | null
    name: string | null
    orderIndex: number | null
    isEncore: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SetlistCountAggregateOutputType = {
    id: number
    showId: number
    name: number
    orderIndex: number
    isEncore: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SetlistAvgAggregateInputType = {
    orderIndex?: true
  }

  export type SetlistSumAggregateInputType = {
    orderIndex?: true
  }

  export type SetlistMinAggregateInputType = {
    id?: true
    showId?: true
    name?: true
    orderIndex?: true
    isEncore?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SetlistMaxAggregateInputType = {
    id?: true
    showId?: true
    name?: true
    orderIndex?: true
    isEncore?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SetlistCountAggregateInputType = {
    id?: true
    showId?: true
    name?: true
    orderIndex?: true
    isEncore?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SetlistAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Setlist to aggregate.
     */
    where?: SetlistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Setlists to fetch.
     */
    orderBy?: SetlistOrderByWithRelationInput | SetlistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SetlistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Setlists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Setlists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Setlists
    **/
    _count?: true | SetlistCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SetlistAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SetlistSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SetlistMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SetlistMaxAggregateInputType
  }

  export type GetSetlistAggregateType<T extends SetlistAggregateArgs> = {
        [P in keyof T & keyof AggregateSetlist]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSetlist[P]>
      : GetScalarType<T[P], AggregateSetlist[P]>
  }




  export type SetlistGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SetlistWhereInput
    orderBy?: SetlistOrderByWithAggregationInput | SetlistOrderByWithAggregationInput[]
    by: SetlistScalarFieldEnum[] | SetlistScalarFieldEnum
    having?: SetlistScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SetlistCountAggregateInputType | true
    _avg?: SetlistAvgAggregateInputType
    _sum?: SetlistSumAggregateInputType
    _min?: SetlistMinAggregateInputType
    _max?: SetlistMaxAggregateInputType
  }

  export type SetlistGroupByOutputType = {
    id: string
    showId: string
    name: string
    orderIndex: number
    isEncore: boolean
    createdAt: Date
    updatedAt: Date
    _count: SetlistCountAggregateOutputType | null
    _avg: SetlistAvgAggregateOutputType | null
    _sum: SetlistSumAggregateOutputType | null
    _min: SetlistMinAggregateOutputType | null
    _max: SetlistMaxAggregateOutputType | null
  }

  type GetSetlistGroupByPayload<T extends SetlistGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SetlistGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SetlistGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SetlistGroupByOutputType[P]>
            : GetScalarType<T[P], SetlistGroupByOutputType[P]>
        }
      >
    >


  export type SetlistSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    showId?: boolean
    name?: boolean
    orderIndex?: boolean
    isEncore?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    show?: boolean | ShowDefaultArgs<ExtArgs>
    setlistSongs?: boolean | Setlist$setlistSongsArgs<ExtArgs>
    _count?: boolean | SetlistCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["setlist"]>

  export type SetlistSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    showId?: boolean
    name?: boolean
    orderIndex?: boolean
    isEncore?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    show?: boolean | ShowDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["setlist"]>

  export type SetlistSelectScalar = {
    id?: boolean
    showId?: boolean
    name?: boolean
    orderIndex?: boolean
    isEncore?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SetlistInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    show?: boolean | ShowDefaultArgs<ExtArgs>
    setlistSongs?: boolean | Setlist$setlistSongsArgs<ExtArgs>
    _count?: boolean | SetlistCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SetlistIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    show?: boolean | ShowDefaultArgs<ExtArgs>
  }

  export type $SetlistPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Setlist"
    objects: {
      show: Prisma.$ShowPayload<ExtArgs>
      setlistSongs: Prisma.$SetlistSongPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      showId: string
      name: string
      orderIndex: number
      isEncore: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["setlist"]>
    composites: {}
  }

  type SetlistGetPayload<S extends boolean | null | undefined | SetlistDefaultArgs> = $Result.GetResult<Prisma.$SetlistPayload, S>

  type SetlistCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SetlistFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SetlistCountAggregateInputType | true
    }

  export interface SetlistDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Setlist'], meta: { name: 'Setlist' } }
    /**
     * Find zero or one Setlist that matches the filter.
     * @param {SetlistFindUniqueArgs} args - Arguments to find a Setlist
     * @example
     * // Get one Setlist
     * const setlist = await prisma.setlist.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SetlistFindUniqueArgs>(args: SelectSubset<T, SetlistFindUniqueArgs<ExtArgs>>): Prisma__SetlistClient<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Setlist that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SetlistFindUniqueOrThrowArgs} args - Arguments to find a Setlist
     * @example
     * // Get one Setlist
     * const setlist = await prisma.setlist.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SetlistFindUniqueOrThrowArgs>(args: SelectSubset<T, SetlistFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SetlistClient<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Setlist that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistFindFirstArgs} args - Arguments to find a Setlist
     * @example
     * // Get one Setlist
     * const setlist = await prisma.setlist.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SetlistFindFirstArgs>(args?: SelectSubset<T, SetlistFindFirstArgs<ExtArgs>>): Prisma__SetlistClient<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Setlist that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistFindFirstOrThrowArgs} args - Arguments to find a Setlist
     * @example
     * // Get one Setlist
     * const setlist = await prisma.setlist.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SetlistFindFirstOrThrowArgs>(args?: SelectSubset<T, SetlistFindFirstOrThrowArgs<ExtArgs>>): Prisma__SetlistClient<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Setlists that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Setlists
     * const setlists = await prisma.setlist.findMany()
     * 
     * // Get first 10 Setlists
     * const setlists = await prisma.setlist.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const setlistWithIdOnly = await prisma.setlist.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SetlistFindManyArgs>(args?: SelectSubset<T, SetlistFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Setlist.
     * @param {SetlistCreateArgs} args - Arguments to create a Setlist.
     * @example
     * // Create one Setlist
     * const Setlist = await prisma.setlist.create({
     *   data: {
     *     // ... data to create a Setlist
     *   }
     * })
     * 
     */
    create<T extends SetlistCreateArgs>(args: SelectSubset<T, SetlistCreateArgs<ExtArgs>>): Prisma__SetlistClient<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Setlists.
     * @param {SetlistCreateManyArgs} args - Arguments to create many Setlists.
     * @example
     * // Create many Setlists
     * const setlist = await prisma.setlist.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SetlistCreateManyArgs>(args?: SelectSubset<T, SetlistCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Setlists and returns the data saved in the database.
     * @param {SetlistCreateManyAndReturnArgs} args - Arguments to create many Setlists.
     * @example
     * // Create many Setlists
     * const setlist = await prisma.setlist.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Setlists and only return the `id`
     * const setlistWithIdOnly = await prisma.setlist.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SetlistCreateManyAndReturnArgs>(args?: SelectSubset<T, SetlistCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Setlist.
     * @param {SetlistDeleteArgs} args - Arguments to delete one Setlist.
     * @example
     * // Delete one Setlist
     * const Setlist = await prisma.setlist.delete({
     *   where: {
     *     // ... filter to delete one Setlist
     *   }
     * })
     * 
     */
    delete<T extends SetlistDeleteArgs>(args: SelectSubset<T, SetlistDeleteArgs<ExtArgs>>): Prisma__SetlistClient<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Setlist.
     * @param {SetlistUpdateArgs} args - Arguments to update one Setlist.
     * @example
     * // Update one Setlist
     * const setlist = await prisma.setlist.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SetlistUpdateArgs>(args: SelectSubset<T, SetlistUpdateArgs<ExtArgs>>): Prisma__SetlistClient<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Setlists.
     * @param {SetlistDeleteManyArgs} args - Arguments to filter Setlists to delete.
     * @example
     * // Delete a few Setlists
     * const { count } = await prisma.setlist.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SetlistDeleteManyArgs>(args?: SelectSubset<T, SetlistDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Setlists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Setlists
     * const setlist = await prisma.setlist.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SetlistUpdateManyArgs>(args: SelectSubset<T, SetlistUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Setlist.
     * @param {SetlistUpsertArgs} args - Arguments to update or create a Setlist.
     * @example
     * // Update or create a Setlist
     * const setlist = await prisma.setlist.upsert({
     *   create: {
     *     // ... data to create a Setlist
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Setlist we want to update
     *   }
     * })
     */
    upsert<T extends SetlistUpsertArgs>(args: SelectSubset<T, SetlistUpsertArgs<ExtArgs>>): Prisma__SetlistClient<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Setlists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistCountArgs} args - Arguments to filter Setlists to count.
     * @example
     * // Count the number of Setlists
     * const count = await prisma.setlist.count({
     *   where: {
     *     // ... the filter for the Setlists we want to count
     *   }
     * })
    **/
    count<T extends SetlistCountArgs>(
      args?: Subset<T, SetlistCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SetlistCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Setlist.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SetlistAggregateArgs>(args: Subset<T, SetlistAggregateArgs>): Prisma.PrismaPromise<GetSetlistAggregateType<T>>

    /**
     * Group by Setlist.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SetlistGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SetlistGroupByArgs['orderBy'] }
        : { orderBy?: SetlistGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SetlistGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSetlistGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Setlist model
   */
  readonly fields: SetlistFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Setlist.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SetlistClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    show<T extends ShowDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ShowDefaultArgs<ExtArgs>>): Prisma__ShowClient<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    setlistSongs<T extends Setlist$setlistSongsArgs<ExtArgs> = {}>(args?: Subset<T, Setlist$setlistSongsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Setlist model
   */ 
  interface SetlistFieldRefs {
    readonly id: FieldRef<"Setlist", 'String'>
    readonly showId: FieldRef<"Setlist", 'String'>
    readonly name: FieldRef<"Setlist", 'String'>
    readonly orderIndex: FieldRef<"Setlist", 'Int'>
    readonly isEncore: FieldRef<"Setlist", 'Boolean'>
    readonly createdAt: FieldRef<"Setlist", 'DateTime'>
    readonly updatedAt: FieldRef<"Setlist", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Setlist findUnique
   */
  export type SetlistFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistInclude<ExtArgs> | null
    /**
     * Filter, which Setlist to fetch.
     */
    where: SetlistWhereUniqueInput
  }

  /**
   * Setlist findUniqueOrThrow
   */
  export type SetlistFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistInclude<ExtArgs> | null
    /**
     * Filter, which Setlist to fetch.
     */
    where: SetlistWhereUniqueInput
  }

  /**
   * Setlist findFirst
   */
  export type SetlistFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistInclude<ExtArgs> | null
    /**
     * Filter, which Setlist to fetch.
     */
    where?: SetlistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Setlists to fetch.
     */
    orderBy?: SetlistOrderByWithRelationInput | SetlistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Setlists.
     */
    cursor?: SetlistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Setlists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Setlists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Setlists.
     */
    distinct?: SetlistScalarFieldEnum | SetlistScalarFieldEnum[]
  }

  /**
   * Setlist findFirstOrThrow
   */
  export type SetlistFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistInclude<ExtArgs> | null
    /**
     * Filter, which Setlist to fetch.
     */
    where?: SetlistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Setlists to fetch.
     */
    orderBy?: SetlistOrderByWithRelationInput | SetlistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Setlists.
     */
    cursor?: SetlistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Setlists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Setlists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Setlists.
     */
    distinct?: SetlistScalarFieldEnum | SetlistScalarFieldEnum[]
  }

  /**
   * Setlist findMany
   */
  export type SetlistFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistInclude<ExtArgs> | null
    /**
     * Filter, which Setlists to fetch.
     */
    where?: SetlistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Setlists to fetch.
     */
    orderBy?: SetlistOrderByWithRelationInput | SetlistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Setlists.
     */
    cursor?: SetlistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Setlists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Setlists.
     */
    skip?: number
    distinct?: SetlistScalarFieldEnum | SetlistScalarFieldEnum[]
  }

  /**
   * Setlist create
   */
  export type SetlistCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistInclude<ExtArgs> | null
    /**
     * The data needed to create a Setlist.
     */
    data: XOR<SetlistCreateInput, SetlistUncheckedCreateInput>
  }

  /**
   * Setlist createMany
   */
  export type SetlistCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Setlists.
     */
    data: SetlistCreateManyInput | SetlistCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Setlist createManyAndReturn
   */
  export type SetlistCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Setlists.
     */
    data: SetlistCreateManyInput | SetlistCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Setlist update
   */
  export type SetlistUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistInclude<ExtArgs> | null
    /**
     * The data needed to update a Setlist.
     */
    data: XOR<SetlistUpdateInput, SetlistUncheckedUpdateInput>
    /**
     * Choose, which Setlist to update.
     */
    where: SetlistWhereUniqueInput
  }

  /**
   * Setlist updateMany
   */
  export type SetlistUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Setlists.
     */
    data: XOR<SetlistUpdateManyMutationInput, SetlistUncheckedUpdateManyInput>
    /**
     * Filter which Setlists to update
     */
    where?: SetlistWhereInput
  }

  /**
   * Setlist upsert
   */
  export type SetlistUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistInclude<ExtArgs> | null
    /**
     * The filter to search for the Setlist to update in case it exists.
     */
    where: SetlistWhereUniqueInput
    /**
     * In case the Setlist found by the `where` argument doesn't exist, create a new Setlist with this data.
     */
    create: XOR<SetlistCreateInput, SetlistUncheckedCreateInput>
    /**
     * In case the Setlist was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SetlistUpdateInput, SetlistUncheckedUpdateInput>
  }

  /**
   * Setlist delete
   */
  export type SetlistDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistInclude<ExtArgs> | null
    /**
     * Filter which Setlist to delete.
     */
    where: SetlistWhereUniqueInput
  }

  /**
   * Setlist deleteMany
   */
  export type SetlistDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Setlists to delete
     */
    where?: SetlistWhereInput
  }

  /**
   * Setlist.setlistSongs
   */
  export type Setlist$setlistSongsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
    where?: SetlistSongWhereInput
    orderBy?: SetlistSongOrderByWithRelationInput | SetlistSongOrderByWithRelationInput[]
    cursor?: SetlistSongWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SetlistSongScalarFieldEnum | SetlistSongScalarFieldEnum[]
  }

  /**
   * Setlist without action
   */
  export type SetlistDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setlist
     */
    select?: SetlistSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistInclude<ExtArgs> | null
  }


  /**
   * Model SetlistSong
   */

  export type AggregateSetlistSong = {
    _count: SetlistSongCountAggregateOutputType | null
    _avg: SetlistSongAvgAggregateOutputType | null
    _sum: SetlistSongSumAggregateOutputType | null
    _min: SetlistSongMinAggregateOutputType | null
    _max: SetlistSongMaxAggregateOutputType | null
  }

  export type SetlistSongAvgAggregateOutputType = {
    position: number | null
    voteCount: number | null
  }

  export type SetlistSongSumAggregateOutputType = {
    position: number | null
    voteCount: number | null
  }

  export type SetlistSongMinAggregateOutputType = {
    id: string | null
    setlistId: string | null
    songId: string | null
    position: number | null
    voteCount: number | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SetlistSongMaxAggregateOutputType = {
    id: string | null
    setlistId: string | null
    songId: string | null
    position: number | null
    voteCount: number | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SetlistSongCountAggregateOutputType = {
    id: number
    setlistId: number
    songId: number
    position: number
    voteCount: number
    notes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SetlistSongAvgAggregateInputType = {
    position?: true
    voteCount?: true
  }

  export type SetlistSongSumAggregateInputType = {
    position?: true
    voteCount?: true
  }

  export type SetlistSongMinAggregateInputType = {
    id?: true
    setlistId?: true
    songId?: true
    position?: true
    voteCount?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SetlistSongMaxAggregateInputType = {
    id?: true
    setlistId?: true
    songId?: true
    position?: true
    voteCount?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SetlistSongCountAggregateInputType = {
    id?: true
    setlistId?: true
    songId?: true
    position?: true
    voteCount?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SetlistSongAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SetlistSong to aggregate.
     */
    where?: SetlistSongWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SetlistSongs to fetch.
     */
    orderBy?: SetlistSongOrderByWithRelationInput | SetlistSongOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SetlistSongWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SetlistSongs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SetlistSongs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SetlistSongs
    **/
    _count?: true | SetlistSongCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SetlistSongAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SetlistSongSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SetlistSongMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SetlistSongMaxAggregateInputType
  }

  export type GetSetlistSongAggregateType<T extends SetlistSongAggregateArgs> = {
        [P in keyof T & keyof AggregateSetlistSong]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSetlistSong[P]>
      : GetScalarType<T[P], AggregateSetlistSong[P]>
  }




  export type SetlistSongGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SetlistSongWhereInput
    orderBy?: SetlistSongOrderByWithAggregationInput | SetlistSongOrderByWithAggregationInput[]
    by: SetlistSongScalarFieldEnum[] | SetlistSongScalarFieldEnum
    having?: SetlistSongScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SetlistSongCountAggregateInputType | true
    _avg?: SetlistSongAvgAggregateInputType
    _sum?: SetlistSongSumAggregateInputType
    _min?: SetlistSongMinAggregateInputType
    _max?: SetlistSongMaxAggregateInputType
  }

  export type SetlistSongGroupByOutputType = {
    id: string
    setlistId: string
    songId: string
    position: number
    voteCount: number
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: SetlistSongCountAggregateOutputType | null
    _avg: SetlistSongAvgAggregateOutputType | null
    _sum: SetlistSongSumAggregateOutputType | null
    _min: SetlistSongMinAggregateOutputType | null
    _max: SetlistSongMaxAggregateOutputType | null
  }

  type GetSetlistSongGroupByPayload<T extends SetlistSongGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SetlistSongGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SetlistSongGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SetlistSongGroupByOutputType[P]>
            : GetScalarType<T[P], SetlistSongGroupByOutputType[P]>
        }
      >
    >


  export type SetlistSongSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    setlistId?: boolean
    songId?: boolean
    position?: boolean
    voteCount?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    setlist?: boolean | SetlistDefaultArgs<ExtArgs>
    song?: boolean | SongDefaultArgs<ExtArgs>
    votes?: boolean | SetlistSong$votesArgs<ExtArgs>
    _count?: boolean | SetlistSongCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["setlistSong"]>

  export type SetlistSongSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    setlistId?: boolean
    songId?: boolean
    position?: boolean
    voteCount?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    setlist?: boolean | SetlistDefaultArgs<ExtArgs>
    song?: boolean | SongDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["setlistSong"]>

  export type SetlistSongSelectScalar = {
    id?: boolean
    setlistId?: boolean
    songId?: boolean
    position?: boolean
    voteCount?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SetlistSongInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    setlist?: boolean | SetlistDefaultArgs<ExtArgs>
    song?: boolean | SongDefaultArgs<ExtArgs>
    votes?: boolean | SetlistSong$votesArgs<ExtArgs>
    _count?: boolean | SetlistSongCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SetlistSongIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    setlist?: boolean | SetlistDefaultArgs<ExtArgs>
    song?: boolean | SongDefaultArgs<ExtArgs>
  }

  export type $SetlistSongPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SetlistSong"
    objects: {
      setlist: Prisma.$SetlistPayload<ExtArgs>
      song: Prisma.$SongPayload<ExtArgs>
      votes: Prisma.$VotePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      setlistId: string
      songId: string
      position: number
      voteCount: number
      notes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["setlistSong"]>
    composites: {}
  }

  type SetlistSongGetPayload<S extends boolean | null | undefined | SetlistSongDefaultArgs> = $Result.GetResult<Prisma.$SetlistSongPayload, S>

  type SetlistSongCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SetlistSongFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SetlistSongCountAggregateInputType | true
    }

  export interface SetlistSongDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SetlistSong'], meta: { name: 'SetlistSong' } }
    /**
     * Find zero or one SetlistSong that matches the filter.
     * @param {SetlistSongFindUniqueArgs} args - Arguments to find a SetlistSong
     * @example
     * // Get one SetlistSong
     * const setlistSong = await prisma.setlistSong.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SetlistSongFindUniqueArgs>(args: SelectSubset<T, SetlistSongFindUniqueArgs<ExtArgs>>): Prisma__SetlistSongClient<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one SetlistSong that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SetlistSongFindUniqueOrThrowArgs} args - Arguments to find a SetlistSong
     * @example
     * // Get one SetlistSong
     * const setlistSong = await prisma.setlistSong.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SetlistSongFindUniqueOrThrowArgs>(args: SelectSubset<T, SetlistSongFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SetlistSongClient<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first SetlistSong that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistSongFindFirstArgs} args - Arguments to find a SetlistSong
     * @example
     * // Get one SetlistSong
     * const setlistSong = await prisma.setlistSong.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SetlistSongFindFirstArgs>(args?: SelectSubset<T, SetlistSongFindFirstArgs<ExtArgs>>): Prisma__SetlistSongClient<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first SetlistSong that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistSongFindFirstOrThrowArgs} args - Arguments to find a SetlistSong
     * @example
     * // Get one SetlistSong
     * const setlistSong = await prisma.setlistSong.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SetlistSongFindFirstOrThrowArgs>(args?: SelectSubset<T, SetlistSongFindFirstOrThrowArgs<ExtArgs>>): Prisma__SetlistSongClient<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more SetlistSongs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistSongFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SetlistSongs
     * const setlistSongs = await prisma.setlistSong.findMany()
     * 
     * // Get first 10 SetlistSongs
     * const setlistSongs = await prisma.setlistSong.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const setlistSongWithIdOnly = await prisma.setlistSong.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SetlistSongFindManyArgs>(args?: SelectSubset<T, SetlistSongFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a SetlistSong.
     * @param {SetlistSongCreateArgs} args - Arguments to create a SetlistSong.
     * @example
     * // Create one SetlistSong
     * const SetlistSong = await prisma.setlistSong.create({
     *   data: {
     *     // ... data to create a SetlistSong
     *   }
     * })
     * 
     */
    create<T extends SetlistSongCreateArgs>(args: SelectSubset<T, SetlistSongCreateArgs<ExtArgs>>): Prisma__SetlistSongClient<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many SetlistSongs.
     * @param {SetlistSongCreateManyArgs} args - Arguments to create many SetlistSongs.
     * @example
     * // Create many SetlistSongs
     * const setlistSong = await prisma.setlistSong.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SetlistSongCreateManyArgs>(args?: SelectSubset<T, SetlistSongCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SetlistSongs and returns the data saved in the database.
     * @param {SetlistSongCreateManyAndReturnArgs} args - Arguments to create many SetlistSongs.
     * @example
     * // Create many SetlistSongs
     * const setlistSong = await prisma.setlistSong.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SetlistSongs and only return the `id`
     * const setlistSongWithIdOnly = await prisma.setlistSong.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SetlistSongCreateManyAndReturnArgs>(args?: SelectSubset<T, SetlistSongCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a SetlistSong.
     * @param {SetlistSongDeleteArgs} args - Arguments to delete one SetlistSong.
     * @example
     * // Delete one SetlistSong
     * const SetlistSong = await prisma.setlistSong.delete({
     *   where: {
     *     // ... filter to delete one SetlistSong
     *   }
     * })
     * 
     */
    delete<T extends SetlistSongDeleteArgs>(args: SelectSubset<T, SetlistSongDeleteArgs<ExtArgs>>): Prisma__SetlistSongClient<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one SetlistSong.
     * @param {SetlistSongUpdateArgs} args - Arguments to update one SetlistSong.
     * @example
     * // Update one SetlistSong
     * const setlistSong = await prisma.setlistSong.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SetlistSongUpdateArgs>(args: SelectSubset<T, SetlistSongUpdateArgs<ExtArgs>>): Prisma__SetlistSongClient<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more SetlistSongs.
     * @param {SetlistSongDeleteManyArgs} args - Arguments to filter SetlistSongs to delete.
     * @example
     * // Delete a few SetlistSongs
     * const { count } = await prisma.setlistSong.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SetlistSongDeleteManyArgs>(args?: SelectSubset<T, SetlistSongDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SetlistSongs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistSongUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SetlistSongs
     * const setlistSong = await prisma.setlistSong.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SetlistSongUpdateManyArgs>(args: SelectSubset<T, SetlistSongUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one SetlistSong.
     * @param {SetlistSongUpsertArgs} args - Arguments to update or create a SetlistSong.
     * @example
     * // Update or create a SetlistSong
     * const setlistSong = await prisma.setlistSong.upsert({
     *   create: {
     *     // ... data to create a SetlistSong
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SetlistSong we want to update
     *   }
     * })
     */
    upsert<T extends SetlistSongUpsertArgs>(args: SelectSubset<T, SetlistSongUpsertArgs<ExtArgs>>): Prisma__SetlistSongClient<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of SetlistSongs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistSongCountArgs} args - Arguments to filter SetlistSongs to count.
     * @example
     * // Count the number of SetlistSongs
     * const count = await prisma.setlistSong.count({
     *   where: {
     *     // ... the filter for the SetlistSongs we want to count
     *   }
     * })
    **/
    count<T extends SetlistSongCountArgs>(
      args?: Subset<T, SetlistSongCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SetlistSongCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SetlistSong.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistSongAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SetlistSongAggregateArgs>(args: Subset<T, SetlistSongAggregateArgs>): Prisma.PrismaPromise<GetSetlistSongAggregateType<T>>

    /**
     * Group by SetlistSong.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SetlistSongGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SetlistSongGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SetlistSongGroupByArgs['orderBy'] }
        : { orderBy?: SetlistSongGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SetlistSongGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSetlistSongGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SetlistSong model
   */
  readonly fields: SetlistSongFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SetlistSong.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SetlistSongClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    setlist<T extends SetlistDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SetlistDefaultArgs<ExtArgs>>): Prisma__SetlistClient<$Result.GetResult<Prisma.$SetlistPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    song<T extends SongDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SongDefaultArgs<ExtArgs>>): Prisma__SongClient<$Result.GetResult<Prisma.$SongPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    votes<T extends SetlistSong$votesArgs<ExtArgs> = {}>(args?: Subset<T, SetlistSong$votesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SetlistSong model
   */ 
  interface SetlistSongFieldRefs {
    readonly id: FieldRef<"SetlistSong", 'String'>
    readonly setlistId: FieldRef<"SetlistSong", 'String'>
    readonly songId: FieldRef<"SetlistSong", 'String'>
    readonly position: FieldRef<"SetlistSong", 'Int'>
    readonly voteCount: FieldRef<"SetlistSong", 'Int'>
    readonly notes: FieldRef<"SetlistSong", 'String'>
    readonly createdAt: FieldRef<"SetlistSong", 'DateTime'>
    readonly updatedAt: FieldRef<"SetlistSong", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SetlistSong findUnique
   */
  export type SetlistSongFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
    /**
     * Filter, which SetlistSong to fetch.
     */
    where: SetlistSongWhereUniqueInput
  }

  /**
   * SetlistSong findUniqueOrThrow
   */
  export type SetlistSongFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
    /**
     * Filter, which SetlistSong to fetch.
     */
    where: SetlistSongWhereUniqueInput
  }

  /**
   * SetlistSong findFirst
   */
  export type SetlistSongFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
    /**
     * Filter, which SetlistSong to fetch.
     */
    where?: SetlistSongWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SetlistSongs to fetch.
     */
    orderBy?: SetlistSongOrderByWithRelationInput | SetlistSongOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SetlistSongs.
     */
    cursor?: SetlistSongWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SetlistSongs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SetlistSongs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SetlistSongs.
     */
    distinct?: SetlistSongScalarFieldEnum | SetlistSongScalarFieldEnum[]
  }

  /**
   * SetlistSong findFirstOrThrow
   */
  export type SetlistSongFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
    /**
     * Filter, which SetlistSong to fetch.
     */
    where?: SetlistSongWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SetlistSongs to fetch.
     */
    orderBy?: SetlistSongOrderByWithRelationInput | SetlistSongOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SetlistSongs.
     */
    cursor?: SetlistSongWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SetlistSongs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SetlistSongs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SetlistSongs.
     */
    distinct?: SetlistSongScalarFieldEnum | SetlistSongScalarFieldEnum[]
  }

  /**
   * SetlistSong findMany
   */
  export type SetlistSongFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
    /**
     * Filter, which SetlistSongs to fetch.
     */
    where?: SetlistSongWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SetlistSongs to fetch.
     */
    orderBy?: SetlistSongOrderByWithRelationInput | SetlistSongOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SetlistSongs.
     */
    cursor?: SetlistSongWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SetlistSongs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SetlistSongs.
     */
    skip?: number
    distinct?: SetlistSongScalarFieldEnum | SetlistSongScalarFieldEnum[]
  }

  /**
   * SetlistSong create
   */
  export type SetlistSongCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
    /**
     * The data needed to create a SetlistSong.
     */
    data: XOR<SetlistSongCreateInput, SetlistSongUncheckedCreateInput>
  }

  /**
   * SetlistSong createMany
   */
  export type SetlistSongCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SetlistSongs.
     */
    data: SetlistSongCreateManyInput | SetlistSongCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SetlistSong createManyAndReturn
   */
  export type SetlistSongCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many SetlistSongs.
     */
    data: SetlistSongCreateManyInput | SetlistSongCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SetlistSong update
   */
  export type SetlistSongUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
    /**
     * The data needed to update a SetlistSong.
     */
    data: XOR<SetlistSongUpdateInput, SetlistSongUncheckedUpdateInput>
    /**
     * Choose, which SetlistSong to update.
     */
    where: SetlistSongWhereUniqueInput
  }

  /**
   * SetlistSong updateMany
   */
  export type SetlistSongUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SetlistSongs.
     */
    data: XOR<SetlistSongUpdateManyMutationInput, SetlistSongUncheckedUpdateManyInput>
    /**
     * Filter which SetlistSongs to update
     */
    where?: SetlistSongWhereInput
  }

  /**
   * SetlistSong upsert
   */
  export type SetlistSongUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
    /**
     * The filter to search for the SetlistSong to update in case it exists.
     */
    where: SetlistSongWhereUniqueInput
    /**
     * In case the SetlistSong found by the `where` argument doesn't exist, create a new SetlistSong with this data.
     */
    create: XOR<SetlistSongCreateInput, SetlistSongUncheckedCreateInput>
    /**
     * In case the SetlistSong was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SetlistSongUpdateInput, SetlistSongUncheckedUpdateInput>
  }

  /**
   * SetlistSong delete
   */
  export type SetlistSongDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
    /**
     * Filter which SetlistSong to delete.
     */
    where: SetlistSongWhereUniqueInput
  }

  /**
   * SetlistSong deleteMany
   */
  export type SetlistSongDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SetlistSongs to delete
     */
    where?: SetlistSongWhereInput
  }

  /**
   * SetlistSong.votes
   */
  export type SetlistSong$votesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    where?: VoteWhereInput
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    cursor?: VoteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VoteScalarFieldEnum | VoteScalarFieldEnum[]
  }

  /**
   * SetlistSong without action
   */
  export type SetlistSongDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SetlistSong
     */
    select?: SetlistSongSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SetlistSongInclude<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    displayName: string | null
    avatarUrl: string | null
    spotifyId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    displayName: string | null
    avatarUrl: string | null
    spotifyId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    displayName: number
    avatarUrl: number
    spotifyId: number
    preferences: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    displayName?: true
    avatarUrl?: true
    spotifyId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    displayName?: true
    avatarUrl?: true
    spotifyId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    displayName?: true
    avatarUrl?: true
    spotifyId?: true
    preferences?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string | null
    displayName: string | null
    avatarUrl: string | null
    spotifyId: string | null
    preferences: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    displayName?: boolean
    avatarUrl?: boolean
    spotifyId?: boolean
    preferences?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    votes?: boolean | User$votesArgs<ExtArgs>
    voteAnalytics?: boolean | User$voteAnalyticsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    displayName?: boolean
    avatarUrl?: boolean
    spotifyId?: boolean
    preferences?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    displayName?: boolean
    avatarUrl?: boolean
    spotifyId?: boolean
    preferences?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    votes?: boolean | User$votesArgs<ExtArgs>
    voteAnalytics?: boolean | User$voteAnalyticsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      votes: Prisma.$VotePayload<ExtArgs>[]
      voteAnalytics: Prisma.$VoteAnalyticsPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string | null
      displayName: string | null
      avatarUrl: string | null
      spotifyId: string | null
      preferences: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    votes<T extends User$votesArgs<ExtArgs> = {}>(args?: Subset<T, User$votesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "findMany"> | Null>
    voteAnalytics<T extends User$voteAnalyticsArgs<ExtArgs> = {}>(args?: Subset<T, User$voteAnalyticsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly displayName: FieldRef<"User", 'String'>
    readonly avatarUrl: FieldRef<"User", 'String'>
    readonly spotifyId: FieldRef<"User", 'String'>
    readonly preferences: FieldRef<"User", 'Json'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User.votes
   */
  export type User$votesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    where?: VoteWhereInput
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    cursor?: VoteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VoteScalarFieldEnum | VoteScalarFieldEnum[]
  }

  /**
   * User.voteAnalytics
   */
  export type User$voteAnalyticsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
    where?: VoteAnalyticsWhereInput
    orderBy?: VoteAnalyticsOrderByWithRelationInput | VoteAnalyticsOrderByWithRelationInput[]
    cursor?: VoteAnalyticsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VoteAnalyticsScalarFieldEnum | VoteAnalyticsScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Vote
   */

  export type AggregateVote = {
    _count: VoteCountAggregateOutputType | null
    _min: VoteMinAggregateOutputType | null
    _max: VoteMaxAggregateOutputType | null
  }

  export type VoteMinAggregateOutputType = {
    id: string | null
    userId: string | null
    setlistSongId: string | null
    showId: string | null
    voteType: string | null
    createdAt: Date | null
  }

  export type VoteMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    setlistSongId: string | null
    showId: string | null
    voteType: string | null
    createdAt: Date | null
  }

  export type VoteCountAggregateOutputType = {
    id: number
    userId: number
    setlistSongId: number
    showId: number
    voteType: number
    createdAt: number
    _all: number
  }


  export type VoteMinAggregateInputType = {
    id?: true
    userId?: true
    setlistSongId?: true
    showId?: true
    voteType?: true
    createdAt?: true
  }

  export type VoteMaxAggregateInputType = {
    id?: true
    userId?: true
    setlistSongId?: true
    showId?: true
    voteType?: true
    createdAt?: true
  }

  export type VoteCountAggregateInputType = {
    id?: true
    userId?: true
    setlistSongId?: true
    showId?: true
    voteType?: true
    createdAt?: true
    _all?: true
  }

  export type VoteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Vote to aggregate.
     */
    where?: VoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Votes to fetch.
     */
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Votes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Votes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Votes
    **/
    _count?: true | VoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VoteMaxAggregateInputType
  }

  export type GetVoteAggregateType<T extends VoteAggregateArgs> = {
        [P in keyof T & keyof AggregateVote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVote[P]>
      : GetScalarType<T[P], AggregateVote[P]>
  }




  export type VoteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VoteWhereInput
    orderBy?: VoteOrderByWithAggregationInput | VoteOrderByWithAggregationInput[]
    by: VoteScalarFieldEnum[] | VoteScalarFieldEnum
    having?: VoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VoteCountAggregateInputType | true
    _min?: VoteMinAggregateInputType
    _max?: VoteMaxAggregateInputType
  }

  export type VoteGroupByOutputType = {
    id: string
    userId: string
    setlistSongId: string
    showId: string
    voteType: string
    createdAt: Date
    _count: VoteCountAggregateOutputType | null
    _min: VoteMinAggregateOutputType | null
    _max: VoteMaxAggregateOutputType | null
  }

  type GetVoteGroupByPayload<T extends VoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VoteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VoteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VoteGroupByOutputType[P]>
            : GetScalarType<T[P], VoteGroupByOutputType[P]>
        }
      >
    >


  export type VoteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    setlistSongId?: boolean
    showId?: boolean
    voteType?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    setlistSong?: boolean | SetlistSongDefaultArgs<ExtArgs>
    show?: boolean | ShowDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["vote"]>

  export type VoteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    setlistSongId?: boolean
    showId?: boolean
    voteType?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    setlistSong?: boolean | SetlistSongDefaultArgs<ExtArgs>
    show?: boolean | ShowDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["vote"]>

  export type VoteSelectScalar = {
    id?: boolean
    userId?: boolean
    setlistSongId?: boolean
    showId?: boolean
    voteType?: boolean
    createdAt?: boolean
  }

  export type VoteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    setlistSong?: boolean | SetlistSongDefaultArgs<ExtArgs>
    show?: boolean | ShowDefaultArgs<ExtArgs>
  }
  export type VoteIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    setlistSong?: boolean | SetlistSongDefaultArgs<ExtArgs>
    show?: boolean | ShowDefaultArgs<ExtArgs>
  }

  export type $VotePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Vote"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      setlistSong: Prisma.$SetlistSongPayload<ExtArgs>
      show: Prisma.$ShowPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      setlistSongId: string
      showId: string
      voteType: string
      createdAt: Date
    }, ExtArgs["result"]["vote"]>
    composites: {}
  }

  type VoteGetPayload<S extends boolean | null | undefined | VoteDefaultArgs> = $Result.GetResult<Prisma.$VotePayload, S>

  type VoteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<VoteFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: VoteCountAggregateInputType | true
    }

  export interface VoteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Vote'], meta: { name: 'Vote' } }
    /**
     * Find zero or one Vote that matches the filter.
     * @param {VoteFindUniqueArgs} args - Arguments to find a Vote
     * @example
     * // Get one Vote
     * const vote = await prisma.vote.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VoteFindUniqueArgs>(args: SelectSubset<T, VoteFindUniqueArgs<ExtArgs>>): Prisma__VoteClient<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Vote that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {VoteFindUniqueOrThrowArgs} args - Arguments to find a Vote
     * @example
     * // Get one Vote
     * const vote = await prisma.vote.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VoteFindUniqueOrThrowArgs>(args: SelectSubset<T, VoteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VoteClient<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Vote that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteFindFirstArgs} args - Arguments to find a Vote
     * @example
     * // Get one Vote
     * const vote = await prisma.vote.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VoteFindFirstArgs>(args?: SelectSubset<T, VoteFindFirstArgs<ExtArgs>>): Prisma__VoteClient<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Vote that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteFindFirstOrThrowArgs} args - Arguments to find a Vote
     * @example
     * // Get one Vote
     * const vote = await prisma.vote.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VoteFindFirstOrThrowArgs>(args?: SelectSubset<T, VoteFindFirstOrThrowArgs<ExtArgs>>): Prisma__VoteClient<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Votes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Votes
     * const votes = await prisma.vote.findMany()
     * 
     * // Get first 10 Votes
     * const votes = await prisma.vote.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const voteWithIdOnly = await prisma.vote.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VoteFindManyArgs>(args?: SelectSubset<T, VoteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Vote.
     * @param {VoteCreateArgs} args - Arguments to create a Vote.
     * @example
     * // Create one Vote
     * const Vote = await prisma.vote.create({
     *   data: {
     *     // ... data to create a Vote
     *   }
     * })
     * 
     */
    create<T extends VoteCreateArgs>(args: SelectSubset<T, VoteCreateArgs<ExtArgs>>): Prisma__VoteClient<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Votes.
     * @param {VoteCreateManyArgs} args - Arguments to create many Votes.
     * @example
     * // Create many Votes
     * const vote = await prisma.vote.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VoteCreateManyArgs>(args?: SelectSubset<T, VoteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Votes and returns the data saved in the database.
     * @param {VoteCreateManyAndReturnArgs} args - Arguments to create many Votes.
     * @example
     * // Create many Votes
     * const vote = await prisma.vote.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Votes and only return the `id`
     * const voteWithIdOnly = await prisma.vote.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VoteCreateManyAndReturnArgs>(args?: SelectSubset<T, VoteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Vote.
     * @param {VoteDeleteArgs} args - Arguments to delete one Vote.
     * @example
     * // Delete one Vote
     * const Vote = await prisma.vote.delete({
     *   where: {
     *     // ... filter to delete one Vote
     *   }
     * })
     * 
     */
    delete<T extends VoteDeleteArgs>(args: SelectSubset<T, VoteDeleteArgs<ExtArgs>>): Prisma__VoteClient<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Vote.
     * @param {VoteUpdateArgs} args - Arguments to update one Vote.
     * @example
     * // Update one Vote
     * const vote = await prisma.vote.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VoteUpdateArgs>(args: SelectSubset<T, VoteUpdateArgs<ExtArgs>>): Prisma__VoteClient<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Votes.
     * @param {VoteDeleteManyArgs} args - Arguments to filter Votes to delete.
     * @example
     * // Delete a few Votes
     * const { count } = await prisma.vote.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VoteDeleteManyArgs>(args?: SelectSubset<T, VoteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Votes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Votes
     * const vote = await prisma.vote.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VoteUpdateManyArgs>(args: SelectSubset<T, VoteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Vote.
     * @param {VoteUpsertArgs} args - Arguments to update or create a Vote.
     * @example
     * // Update or create a Vote
     * const vote = await prisma.vote.upsert({
     *   create: {
     *     // ... data to create a Vote
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Vote we want to update
     *   }
     * })
     */
    upsert<T extends VoteUpsertArgs>(args: SelectSubset<T, VoteUpsertArgs<ExtArgs>>): Prisma__VoteClient<$Result.GetResult<Prisma.$VotePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Votes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteCountArgs} args - Arguments to filter Votes to count.
     * @example
     * // Count the number of Votes
     * const count = await prisma.vote.count({
     *   where: {
     *     // ... the filter for the Votes we want to count
     *   }
     * })
    **/
    count<T extends VoteCountArgs>(
      args?: Subset<T, VoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VoteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Vote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VoteAggregateArgs>(args: Subset<T, VoteAggregateArgs>): Prisma.PrismaPromise<GetVoteAggregateType<T>>

    /**
     * Group by Vote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VoteGroupByArgs['orderBy'] }
        : { orderBy?: VoteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VoteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVoteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Vote model
   */
  readonly fields: VoteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Vote.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VoteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    setlistSong<T extends SetlistSongDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SetlistSongDefaultArgs<ExtArgs>>): Prisma__SetlistSongClient<$Result.GetResult<Prisma.$SetlistSongPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    show<T extends ShowDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ShowDefaultArgs<ExtArgs>>): Prisma__ShowClient<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Vote model
   */ 
  interface VoteFieldRefs {
    readonly id: FieldRef<"Vote", 'String'>
    readonly userId: FieldRef<"Vote", 'String'>
    readonly setlistSongId: FieldRef<"Vote", 'String'>
    readonly showId: FieldRef<"Vote", 'String'>
    readonly voteType: FieldRef<"Vote", 'String'>
    readonly createdAt: FieldRef<"Vote", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Vote findUnique
   */
  export type VoteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter, which Vote to fetch.
     */
    where: VoteWhereUniqueInput
  }

  /**
   * Vote findUniqueOrThrow
   */
  export type VoteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter, which Vote to fetch.
     */
    where: VoteWhereUniqueInput
  }

  /**
   * Vote findFirst
   */
  export type VoteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter, which Vote to fetch.
     */
    where?: VoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Votes to fetch.
     */
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Votes.
     */
    cursor?: VoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Votes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Votes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Votes.
     */
    distinct?: VoteScalarFieldEnum | VoteScalarFieldEnum[]
  }

  /**
   * Vote findFirstOrThrow
   */
  export type VoteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter, which Vote to fetch.
     */
    where?: VoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Votes to fetch.
     */
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Votes.
     */
    cursor?: VoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Votes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Votes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Votes.
     */
    distinct?: VoteScalarFieldEnum | VoteScalarFieldEnum[]
  }

  /**
   * Vote findMany
   */
  export type VoteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter, which Votes to fetch.
     */
    where?: VoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Votes to fetch.
     */
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Votes.
     */
    cursor?: VoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Votes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Votes.
     */
    skip?: number
    distinct?: VoteScalarFieldEnum | VoteScalarFieldEnum[]
  }

  /**
   * Vote create
   */
  export type VoteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * The data needed to create a Vote.
     */
    data: XOR<VoteCreateInput, VoteUncheckedCreateInput>
  }

  /**
   * Vote createMany
   */
  export type VoteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Votes.
     */
    data: VoteCreateManyInput | VoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Vote createManyAndReturn
   */
  export type VoteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Votes.
     */
    data: VoteCreateManyInput | VoteCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Vote update
   */
  export type VoteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * The data needed to update a Vote.
     */
    data: XOR<VoteUpdateInput, VoteUncheckedUpdateInput>
    /**
     * Choose, which Vote to update.
     */
    where: VoteWhereUniqueInput
  }

  /**
   * Vote updateMany
   */
  export type VoteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Votes.
     */
    data: XOR<VoteUpdateManyMutationInput, VoteUncheckedUpdateManyInput>
    /**
     * Filter which Votes to update
     */
    where?: VoteWhereInput
  }

  /**
   * Vote upsert
   */
  export type VoteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * The filter to search for the Vote to update in case it exists.
     */
    where: VoteWhereUniqueInput
    /**
     * In case the Vote found by the `where` argument doesn't exist, create a new Vote with this data.
     */
    create: XOR<VoteCreateInput, VoteUncheckedCreateInput>
    /**
     * In case the Vote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VoteUpdateInput, VoteUncheckedUpdateInput>
  }

  /**
   * Vote delete
   */
  export type VoteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter which Vote to delete.
     */
    where: VoteWhereUniqueInput
  }

  /**
   * Vote deleteMany
   */
  export type VoteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Votes to delete
     */
    where?: VoteWhereInput
  }

  /**
   * Vote without action
   */
  export type VoteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
  }


  /**
   * Model VoteAnalytics
   */

  export type AggregateVoteAnalytics = {
    _count: VoteAnalyticsCountAggregateOutputType | null
    _avg: VoteAnalyticsAvgAggregateOutputType | null
    _sum: VoteAnalyticsSumAggregateOutputType | null
    _min: VoteAnalyticsMinAggregateOutputType | null
    _max: VoteAnalyticsMaxAggregateOutputType | null
  }

  export type VoteAnalyticsAvgAggregateOutputType = {
    dailyVotes: number | null
    showVotes: number | null
  }

  export type VoteAnalyticsSumAggregateOutputType = {
    dailyVotes: number | null
    showVotes: number | null
  }

  export type VoteAnalyticsMinAggregateOutputType = {
    id: string | null
    userId: string | null
    showId: string | null
    dailyVotes: number | null
    showVotes: number | null
    lastVoteAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VoteAnalyticsMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    showId: string | null
    dailyVotes: number | null
    showVotes: number | null
    lastVoteAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VoteAnalyticsCountAggregateOutputType = {
    id: number
    userId: number
    showId: number
    dailyVotes: number
    showVotes: number
    lastVoteAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type VoteAnalyticsAvgAggregateInputType = {
    dailyVotes?: true
    showVotes?: true
  }

  export type VoteAnalyticsSumAggregateInputType = {
    dailyVotes?: true
    showVotes?: true
  }

  export type VoteAnalyticsMinAggregateInputType = {
    id?: true
    userId?: true
    showId?: true
    dailyVotes?: true
    showVotes?: true
    lastVoteAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VoteAnalyticsMaxAggregateInputType = {
    id?: true
    userId?: true
    showId?: true
    dailyVotes?: true
    showVotes?: true
    lastVoteAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VoteAnalyticsCountAggregateInputType = {
    id?: true
    userId?: true
    showId?: true
    dailyVotes?: true
    showVotes?: true
    lastVoteAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type VoteAnalyticsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VoteAnalytics to aggregate.
     */
    where?: VoteAnalyticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VoteAnalytics to fetch.
     */
    orderBy?: VoteAnalyticsOrderByWithRelationInput | VoteAnalyticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VoteAnalyticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VoteAnalytics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VoteAnalytics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VoteAnalytics
    **/
    _count?: true | VoteAnalyticsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: VoteAnalyticsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: VoteAnalyticsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VoteAnalyticsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VoteAnalyticsMaxAggregateInputType
  }

  export type GetVoteAnalyticsAggregateType<T extends VoteAnalyticsAggregateArgs> = {
        [P in keyof T & keyof AggregateVoteAnalytics]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVoteAnalytics[P]>
      : GetScalarType<T[P], AggregateVoteAnalytics[P]>
  }




  export type VoteAnalyticsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VoteAnalyticsWhereInput
    orderBy?: VoteAnalyticsOrderByWithAggregationInput | VoteAnalyticsOrderByWithAggregationInput[]
    by: VoteAnalyticsScalarFieldEnum[] | VoteAnalyticsScalarFieldEnum
    having?: VoteAnalyticsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VoteAnalyticsCountAggregateInputType | true
    _avg?: VoteAnalyticsAvgAggregateInputType
    _sum?: VoteAnalyticsSumAggregateInputType
    _min?: VoteAnalyticsMinAggregateInputType
    _max?: VoteAnalyticsMaxAggregateInputType
  }

  export type VoteAnalyticsGroupByOutputType = {
    id: string
    userId: string
    showId: string
    dailyVotes: number
    showVotes: number
    lastVoteAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: VoteAnalyticsCountAggregateOutputType | null
    _avg: VoteAnalyticsAvgAggregateOutputType | null
    _sum: VoteAnalyticsSumAggregateOutputType | null
    _min: VoteAnalyticsMinAggregateOutputType | null
    _max: VoteAnalyticsMaxAggregateOutputType | null
  }

  type GetVoteAnalyticsGroupByPayload<T extends VoteAnalyticsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VoteAnalyticsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VoteAnalyticsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VoteAnalyticsGroupByOutputType[P]>
            : GetScalarType<T[P], VoteAnalyticsGroupByOutputType[P]>
        }
      >
    >


  export type VoteAnalyticsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    showId?: boolean
    dailyVotes?: boolean
    showVotes?: boolean
    lastVoteAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    show?: boolean | ShowDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["voteAnalytics"]>

  export type VoteAnalyticsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    showId?: boolean
    dailyVotes?: boolean
    showVotes?: boolean
    lastVoteAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    show?: boolean | ShowDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["voteAnalytics"]>

  export type VoteAnalyticsSelectScalar = {
    id?: boolean
    userId?: boolean
    showId?: boolean
    dailyVotes?: boolean
    showVotes?: boolean
    lastVoteAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type VoteAnalyticsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    show?: boolean | ShowDefaultArgs<ExtArgs>
  }
  export type VoteAnalyticsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    show?: boolean | ShowDefaultArgs<ExtArgs>
  }

  export type $VoteAnalyticsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VoteAnalytics"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      show: Prisma.$ShowPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      showId: string
      dailyVotes: number
      showVotes: number
      lastVoteAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["voteAnalytics"]>
    composites: {}
  }

  type VoteAnalyticsGetPayload<S extends boolean | null | undefined | VoteAnalyticsDefaultArgs> = $Result.GetResult<Prisma.$VoteAnalyticsPayload, S>

  type VoteAnalyticsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<VoteAnalyticsFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: VoteAnalyticsCountAggregateInputType | true
    }

  export interface VoteAnalyticsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VoteAnalytics'], meta: { name: 'VoteAnalytics' } }
    /**
     * Find zero or one VoteAnalytics that matches the filter.
     * @param {VoteAnalyticsFindUniqueArgs} args - Arguments to find a VoteAnalytics
     * @example
     * // Get one VoteAnalytics
     * const voteAnalytics = await prisma.voteAnalytics.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VoteAnalyticsFindUniqueArgs>(args: SelectSubset<T, VoteAnalyticsFindUniqueArgs<ExtArgs>>): Prisma__VoteAnalyticsClient<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one VoteAnalytics that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {VoteAnalyticsFindUniqueOrThrowArgs} args - Arguments to find a VoteAnalytics
     * @example
     * // Get one VoteAnalytics
     * const voteAnalytics = await prisma.voteAnalytics.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VoteAnalyticsFindUniqueOrThrowArgs>(args: SelectSubset<T, VoteAnalyticsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VoteAnalyticsClient<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first VoteAnalytics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteAnalyticsFindFirstArgs} args - Arguments to find a VoteAnalytics
     * @example
     * // Get one VoteAnalytics
     * const voteAnalytics = await prisma.voteAnalytics.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VoteAnalyticsFindFirstArgs>(args?: SelectSubset<T, VoteAnalyticsFindFirstArgs<ExtArgs>>): Prisma__VoteAnalyticsClient<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first VoteAnalytics that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteAnalyticsFindFirstOrThrowArgs} args - Arguments to find a VoteAnalytics
     * @example
     * // Get one VoteAnalytics
     * const voteAnalytics = await prisma.voteAnalytics.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VoteAnalyticsFindFirstOrThrowArgs>(args?: SelectSubset<T, VoteAnalyticsFindFirstOrThrowArgs<ExtArgs>>): Prisma__VoteAnalyticsClient<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more VoteAnalytics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteAnalyticsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VoteAnalytics
     * const voteAnalytics = await prisma.voteAnalytics.findMany()
     * 
     * // Get first 10 VoteAnalytics
     * const voteAnalytics = await prisma.voteAnalytics.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const voteAnalyticsWithIdOnly = await prisma.voteAnalytics.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VoteAnalyticsFindManyArgs>(args?: SelectSubset<T, VoteAnalyticsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a VoteAnalytics.
     * @param {VoteAnalyticsCreateArgs} args - Arguments to create a VoteAnalytics.
     * @example
     * // Create one VoteAnalytics
     * const VoteAnalytics = await prisma.voteAnalytics.create({
     *   data: {
     *     // ... data to create a VoteAnalytics
     *   }
     * })
     * 
     */
    create<T extends VoteAnalyticsCreateArgs>(args: SelectSubset<T, VoteAnalyticsCreateArgs<ExtArgs>>): Prisma__VoteAnalyticsClient<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many VoteAnalytics.
     * @param {VoteAnalyticsCreateManyArgs} args - Arguments to create many VoteAnalytics.
     * @example
     * // Create many VoteAnalytics
     * const voteAnalytics = await prisma.voteAnalytics.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VoteAnalyticsCreateManyArgs>(args?: SelectSubset<T, VoteAnalyticsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VoteAnalytics and returns the data saved in the database.
     * @param {VoteAnalyticsCreateManyAndReturnArgs} args - Arguments to create many VoteAnalytics.
     * @example
     * // Create many VoteAnalytics
     * const voteAnalytics = await prisma.voteAnalytics.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VoteAnalytics and only return the `id`
     * const voteAnalyticsWithIdOnly = await prisma.voteAnalytics.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VoteAnalyticsCreateManyAndReturnArgs>(args?: SelectSubset<T, VoteAnalyticsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a VoteAnalytics.
     * @param {VoteAnalyticsDeleteArgs} args - Arguments to delete one VoteAnalytics.
     * @example
     * // Delete one VoteAnalytics
     * const VoteAnalytics = await prisma.voteAnalytics.delete({
     *   where: {
     *     // ... filter to delete one VoteAnalytics
     *   }
     * })
     * 
     */
    delete<T extends VoteAnalyticsDeleteArgs>(args: SelectSubset<T, VoteAnalyticsDeleteArgs<ExtArgs>>): Prisma__VoteAnalyticsClient<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one VoteAnalytics.
     * @param {VoteAnalyticsUpdateArgs} args - Arguments to update one VoteAnalytics.
     * @example
     * // Update one VoteAnalytics
     * const voteAnalytics = await prisma.voteAnalytics.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VoteAnalyticsUpdateArgs>(args: SelectSubset<T, VoteAnalyticsUpdateArgs<ExtArgs>>): Prisma__VoteAnalyticsClient<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more VoteAnalytics.
     * @param {VoteAnalyticsDeleteManyArgs} args - Arguments to filter VoteAnalytics to delete.
     * @example
     * // Delete a few VoteAnalytics
     * const { count } = await prisma.voteAnalytics.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VoteAnalyticsDeleteManyArgs>(args?: SelectSubset<T, VoteAnalyticsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VoteAnalytics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteAnalyticsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VoteAnalytics
     * const voteAnalytics = await prisma.voteAnalytics.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VoteAnalyticsUpdateManyArgs>(args: SelectSubset<T, VoteAnalyticsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one VoteAnalytics.
     * @param {VoteAnalyticsUpsertArgs} args - Arguments to update or create a VoteAnalytics.
     * @example
     * // Update or create a VoteAnalytics
     * const voteAnalytics = await prisma.voteAnalytics.upsert({
     *   create: {
     *     // ... data to create a VoteAnalytics
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VoteAnalytics we want to update
     *   }
     * })
     */
    upsert<T extends VoteAnalyticsUpsertArgs>(args: SelectSubset<T, VoteAnalyticsUpsertArgs<ExtArgs>>): Prisma__VoteAnalyticsClient<$Result.GetResult<Prisma.$VoteAnalyticsPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of VoteAnalytics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteAnalyticsCountArgs} args - Arguments to filter VoteAnalytics to count.
     * @example
     * // Count the number of VoteAnalytics
     * const count = await prisma.voteAnalytics.count({
     *   where: {
     *     // ... the filter for the VoteAnalytics we want to count
     *   }
     * })
    **/
    count<T extends VoteAnalyticsCountArgs>(
      args?: Subset<T, VoteAnalyticsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VoteAnalyticsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VoteAnalytics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteAnalyticsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VoteAnalyticsAggregateArgs>(args: Subset<T, VoteAnalyticsAggregateArgs>): Prisma.PrismaPromise<GetVoteAnalyticsAggregateType<T>>

    /**
     * Group by VoteAnalytics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteAnalyticsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VoteAnalyticsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VoteAnalyticsGroupByArgs['orderBy'] }
        : { orderBy?: VoteAnalyticsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VoteAnalyticsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVoteAnalyticsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VoteAnalytics model
   */
  readonly fields: VoteAnalyticsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VoteAnalytics.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VoteAnalyticsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    show<T extends ShowDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ShowDefaultArgs<ExtArgs>>): Prisma__ShowClient<$Result.GetResult<Prisma.$ShowPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VoteAnalytics model
   */ 
  interface VoteAnalyticsFieldRefs {
    readonly id: FieldRef<"VoteAnalytics", 'String'>
    readonly userId: FieldRef<"VoteAnalytics", 'String'>
    readonly showId: FieldRef<"VoteAnalytics", 'String'>
    readonly dailyVotes: FieldRef<"VoteAnalytics", 'Int'>
    readonly showVotes: FieldRef<"VoteAnalytics", 'Int'>
    readonly lastVoteAt: FieldRef<"VoteAnalytics", 'DateTime'>
    readonly createdAt: FieldRef<"VoteAnalytics", 'DateTime'>
    readonly updatedAt: FieldRef<"VoteAnalytics", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * VoteAnalytics findUnique
   */
  export type VoteAnalyticsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
    /**
     * Filter, which VoteAnalytics to fetch.
     */
    where: VoteAnalyticsWhereUniqueInput
  }

  /**
   * VoteAnalytics findUniqueOrThrow
   */
  export type VoteAnalyticsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
    /**
     * Filter, which VoteAnalytics to fetch.
     */
    where: VoteAnalyticsWhereUniqueInput
  }

  /**
   * VoteAnalytics findFirst
   */
  export type VoteAnalyticsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
    /**
     * Filter, which VoteAnalytics to fetch.
     */
    where?: VoteAnalyticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VoteAnalytics to fetch.
     */
    orderBy?: VoteAnalyticsOrderByWithRelationInput | VoteAnalyticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VoteAnalytics.
     */
    cursor?: VoteAnalyticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VoteAnalytics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VoteAnalytics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VoteAnalytics.
     */
    distinct?: VoteAnalyticsScalarFieldEnum | VoteAnalyticsScalarFieldEnum[]
  }

  /**
   * VoteAnalytics findFirstOrThrow
   */
  export type VoteAnalyticsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
    /**
     * Filter, which VoteAnalytics to fetch.
     */
    where?: VoteAnalyticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VoteAnalytics to fetch.
     */
    orderBy?: VoteAnalyticsOrderByWithRelationInput | VoteAnalyticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VoteAnalytics.
     */
    cursor?: VoteAnalyticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VoteAnalytics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VoteAnalytics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VoteAnalytics.
     */
    distinct?: VoteAnalyticsScalarFieldEnum | VoteAnalyticsScalarFieldEnum[]
  }

  /**
   * VoteAnalytics findMany
   */
  export type VoteAnalyticsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
    /**
     * Filter, which VoteAnalytics to fetch.
     */
    where?: VoteAnalyticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VoteAnalytics to fetch.
     */
    orderBy?: VoteAnalyticsOrderByWithRelationInput | VoteAnalyticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VoteAnalytics.
     */
    cursor?: VoteAnalyticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VoteAnalytics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VoteAnalytics.
     */
    skip?: number
    distinct?: VoteAnalyticsScalarFieldEnum | VoteAnalyticsScalarFieldEnum[]
  }

  /**
   * VoteAnalytics create
   */
  export type VoteAnalyticsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
    /**
     * The data needed to create a VoteAnalytics.
     */
    data: XOR<VoteAnalyticsCreateInput, VoteAnalyticsUncheckedCreateInput>
  }

  /**
   * VoteAnalytics createMany
   */
  export type VoteAnalyticsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VoteAnalytics.
     */
    data: VoteAnalyticsCreateManyInput | VoteAnalyticsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VoteAnalytics createManyAndReturn
   */
  export type VoteAnalyticsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many VoteAnalytics.
     */
    data: VoteAnalyticsCreateManyInput | VoteAnalyticsCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * VoteAnalytics update
   */
  export type VoteAnalyticsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
    /**
     * The data needed to update a VoteAnalytics.
     */
    data: XOR<VoteAnalyticsUpdateInput, VoteAnalyticsUncheckedUpdateInput>
    /**
     * Choose, which VoteAnalytics to update.
     */
    where: VoteAnalyticsWhereUniqueInput
  }

  /**
   * VoteAnalytics updateMany
   */
  export type VoteAnalyticsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VoteAnalytics.
     */
    data: XOR<VoteAnalyticsUpdateManyMutationInput, VoteAnalyticsUncheckedUpdateManyInput>
    /**
     * Filter which VoteAnalytics to update
     */
    where?: VoteAnalyticsWhereInput
  }

  /**
   * VoteAnalytics upsert
   */
  export type VoteAnalyticsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
    /**
     * The filter to search for the VoteAnalytics to update in case it exists.
     */
    where: VoteAnalyticsWhereUniqueInput
    /**
     * In case the VoteAnalytics found by the `where` argument doesn't exist, create a new VoteAnalytics with this data.
     */
    create: XOR<VoteAnalyticsCreateInput, VoteAnalyticsUncheckedCreateInput>
    /**
     * In case the VoteAnalytics was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VoteAnalyticsUpdateInput, VoteAnalyticsUncheckedUpdateInput>
  }

  /**
   * VoteAnalytics delete
   */
  export type VoteAnalyticsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
    /**
     * Filter which VoteAnalytics to delete.
     */
    where: VoteAnalyticsWhereUniqueInput
  }

  /**
   * VoteAnalytics deleteMany
   */
  export type VoteAnalyticsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VoteAnalytics to delete
     */
    where?: VoteAnalyticsWhereInput
  }

  /**
   * VoteAnalytics without action
   */
  export type VoteAnalyticsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoteAnalytics
     */
    select?: VoteAnalyticsSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteAnalyticsInclude<ExtArgs> | null
  }


  /**
   * Model SyncHistory
   */

  export type AggregateSyncHistory = {
    _count: SyncHistoryCountAggregateOutputType | null
    _avg: SyncHistoryAvgAggregateOutputType | null
    _sum: SyncHistorySumAggregateOutputType | null
    _min: SyncHistoryMinAggregateOutputType | null
    _max: SyncHistoryMaxAggregateOutputType | null
  }

  export type SyncHistoryAvgAggregateOutputType = {
    itemsProcessed: number | null
  }

  export type SyncHistorySumAggregateOutputType = {
    itemsProcessed: number | null
  }

  export type SyncHistoryMinAggregateOutputType = {
    id: string | null
    syncType: string | null
    entityType: string | null
    entityId: string | null
    externalId: string | null
    status: string | null
    errorMessage: string | null
    itemsProcessed: number | null
    startedAt: Date | null
    completedAt: Date | null
  }

  export type SyncHistoryMaxAggregateOutputType = {
    id: string | null
    syncType: string | null
    entityType: string | null
    entityId: string | null
    externalId: string | null
    status: string | null
    errorMessage: string | null
    itemsProcessed: number | null
    startedAt: Date | null
    completedAt: Date | null
  }

  export type SyncHistoryCountAggregateOutputType = {
    id: number
    syncType: number
    entityType: number
    entityId: number
    externalId: number
    status: number
    errorMessage: number
    itemsProcessed: number
    startedAt: number
    completedAt: number
    _all: number
  }


  export type SyncHistoryAvgAggregateInputType = {
    itemsProcessed?: true
  }

  export type SyncHistorySumAggregateInputType = {
    itemsProcessed?: true
  }

  export type SyncHistoryMinAggregateInputType = {
    id?: true
    syncType?: true
    entityType?: true
    entityId?: true
    externalId?: true
    status?: true
    errorMessage?: true
    itemsProcessed?: true
    startedAt?: true
    completedAt?: true
  }

  export type SyncHistoryMaxAggregateInputType = {
    id?: true
    syncType?: true
    entityType?: true
    entityId?: true
    externalId?: true
    status?: true
    errorMessage?: true
    itemsProcessed?: true
    startedAt?: true
    completedAt?: true
  }

  export type SyncHistoryCountAggregateInputType = {
    id?: true
    syncType?: true
    entityType?: true
    entityId?: true
    externalId?: true
    status?: true
    errorMessage?: true
    itemsProcessed?: true
    startedAt?: true
    completedAt?: true
    _all?: true
  }

  export type SyncHistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SyncHistory to aggregate.
     */
    where?: SyncHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncHistories to fetch.
     */
    orderBy?: SyncHistoryOrderByWithRelationInput | SyncHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SyncHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SyncHistories
    **/
    _count?: true | SyncHistoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SyncHistoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SyncHistorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SyncHistoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SyncHistoryMaxAggregateInputType
  }

  export type GetSyncHistoryAggregateType<T extends SyncHistoryAggregateArgs> = {
        [P in keyof T & keyof AggregateSyncHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSyncHistory[P]>
      : GetScalarType<T[P], AggregateSyncHistory[P]>
  }




  export type SyncHistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SyncHistoryWhereInput
    orderBy?: SyncHistoryOrderByWithAggregationInput | SyncHistoryOrderByWithAggregationInput[]
    by: SyncHistoryScalarFieldEnum[] | SyncHistoryScalarFieldEnum
    having?: SyncHistoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SyncHistoryCountAggregateInputType | true
    _avg?: SyncHistoryAvgAggregateInputType
    _sum?: SyncHistorySumAggregateInputType
    _min?: SyncHistoryMinAggregateInputType
    _max?: SyncHistoryMaxAggregateInputType
  }

  export type SyncHistoryGroupByOutputType = {
    id: string
    syncType: string
    entityType: string
    entityId: string | null
    externalId: string | null
    status: string
    errorMessage: string | null
    itemsProcessed: number
    startedAt: Date
    completedAt: Date | null
    _count: SyncHistoryCountAggregateOutputType | null
    _avg: SyncHistoryAvgAggregateOutputType | null
    _sum: SyncHistorySumAggregateOutputType | null
    _min: SyncHistoryMinAggregateOutputType | null
    _max: SyncHistoryMaxAggregateOutputType | null
  }

  type GetSyncHistoryGroupByPayload<T extends SyncHistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SyncHistoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SyncHistoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SyncHistoryGroupByOutputType[P]>
            : GetScalarType<T[P], SyncHistoryGroupByOutputType[P]>
        }
      >
    >


  export type SyncHistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    syncType?: boolean
    entityType?: boolean
    entityId?: boolean
    externalId?: boolean
    status?: boolean
    errorMessage?: boolean
    itemsProcessed?: boolean
    startedAt?: boolean
    completedAt?: boolean
  }, ExtArgs["result"]["syncHistory"]>

  export type SyncHistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    syncType?: boolean
    entityType?: boolean
    entityId?: boolean
    externalId?: boolean
    status?: boolean
    errorMessage?: boolean
    itemsProcessed?: boolean
    startedAt?: boolean
    completedAt?: boolean
  }, ExtArgs["result"]["syncHistory"]>

  export type SyncHistorySelectScalar = {
    id?: boolean
    syncType?: boolean
    entityType?: boolean
    entityId?: boolean
    externalId?: boolean
    status?: boolean
    errorMessage?: boolean
    itemsProcessed?: boolean
    startedAt?: boolean
    completedAt?: boolean
  }


  export type $SyncHistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SyncHistory"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      syncType: string
      entityType: string
      entityId: string | null
      externalId: string | null
      status: string
      errorMessage: string | null
      itemsProcessed: number
      startedAt: Date
      completedAt: Date | null
    }, ExtArgs["result"]["syncHistory"]>
    composites: {}
  }

  type SyncHistoryGetPayload<S extends boolean | null | undefined | SyncHistoryDefaultArgs> = $Result.GetResult<Prisma.$SyncHistoryPayload, S>

  type SyncHistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SyncHistoryFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SyncHistoryCountAggregateInputType | true
    }

  export interface SyncHistoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SyncHistory'], meta: { name: 'SyncHistory' } }
    /**
     * Find zero or one SyncHistory that matches the filter.
     * @param {SyncHistoryFindUniqueArgs} args - Arguments to find a SyncHistory
     * @example
     * // Get one SyncHistory
     * const syncHistory = await prisma.syncHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SyncHistoryFindUniqueArgs>(args: SelectSubset<T, SyncHistoryFindUniqueArgs<ExtArgs>>): Prisma__SyncHistoryClient<$Result.GetResult<Prisma.$SyncHistoryPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one SyncHistory that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SyncHistoryFindUniqueOrThrowArgs} args - Arguments to find a SyncHistory
     * @example
     * // Get one SyncHistory
     * const syncHistory = await prisma.syncHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SyncHistoryFindUniqueOrThrowArgs>(args: SelectSubset<T, SyncHistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SyncHistoryClient<$Result.GetResult<Prisma.$SyncHistoryPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first SyncHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncHistoryFindFirstArgs} args - Arguments to find a SyncHistory
     * @example
     * // Get one SyncHistory
     * const syncHistory = await prisma.syncHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SyncHistoryFindFirstArgs>(args?: SelectSubset<T, SyncHistoryFindFirstArgs<ExtArgs>>): Prisma__SyncHistoryClient<$Result.GetResult<Prisma.$SyncHistoryPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first SyncHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncHistoryFindFirstOrThrowArgs} args - Arguments to find a SyncHistory
     * @example
     * // Get one SyncHistory
     * const syncHistory = await prisma.syncHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SyncHistoryFindFirstOrThrowArgs>(args?: SelectSubset<T, SyncHistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__SyncHistoryClient<$Result.GetResult<Prisma.$SyncHistoryPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more SyncHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SyncHistories
     * const syncHistories = await prisma.syncHistory.findMany()
     * 
     * // Get first 10 SyncHistories
     * const syncHistories = await prisma.syncHistory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const syncHistoryWithIdOnly = await prisma.syncHistory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SyncHistoryFindManyArgs>(args?: SelectSubset<T, SyncHistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncHistoryPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a SyncHistory.
     * @param {SyncHistoryCreateArgs} args - Arguments to create a SyncHistory.
     * @example
     * // Create one SyncHistory
     * const SyncHistory = await prisma.syncHistory.create({
     *   data: {
     *     // ... data to create a SyncHistory
     *   }
     * })
     * 
     */
    create<T extends SyncHistoryCreateArgs>(args: SelectSubset<T, SyncHistoryCreateArgs<ExtArgs>>): Prisma__SyncHistoryClient<$Result.GetResult<Prisma.$SyncHistoryPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many SyncHistories.
     * @param {SyncHistoryCreateManyArgs} args - Arguments to create many SyncHistories.
     * @example
     * // Create many SyncHistories
     * const syncHistory = await prisma.syncHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SyncHistoryCreateManyArgs>(args?: SelectSubset<T, SyncHistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SyncHistories and returns the data saved in the database.
     * @param {SyncHistoryCreateManyAndReturnArgs} args - Arguments to create many SyncHistories.
     * @example
     * // Create many SyncHistories
     * const syncHistory = await prisma.syncHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SyncHistories and only return the `id`
     * const syncHistoryWithIdOnly = await prisma.syncHistory.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SyncHistoryCreateManyAndReturnArgs>(args?: SelectSubset<T, SyncHistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncHistoryPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a SyncHistory.
     * @param {SyncHistoryDeleteArgs} args - Arguments to delete one SyncHistory.
     * @example
     * // Delete one SyncHistory
     * const SyncHistory = await prisma.syncHistory.delete({
     *   where: {
     *     // ... filter to delete one SyncHistory
     *   }
     * })
     * 
     */
    delete<T extends SyncHistoryDeleteArgs>(args: SelectSubset<T, SyncHistoryDeleteArgs<ExtArgs>>): Prisma__SyncHistoryClient<$Result.GetResult<Prisma.$SyncHistoryPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one SyncHistory.
     * @param {SyncHistoryUpdateArgs} args - Arguments to update one SyncHistory.
     * @example
     * // Update one SyncHistory
     * const syncHistory = await prisma.syncHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SyncHistoryUpdateArgs>(args: SelectSubset<T, SyncHistoryUpdateArgs<ExtArgs>>): Prisma__SyncHistoryClient<$Result.GetResult<Prisma.$SyncHistoryPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more SyncHistories.
     * @param {SyncHistoryDeleteManyArgs} args - Arguments to filter SyncHistories to delete.
     * @example
     * // Delete a few SyncHistories
     * const { count } = await prisma.syncHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SyncHistoryDeleteManyArgs>(args?: SelectSubset<T, SyncHistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SyncHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SyncHistories
     * const syncHistory = await prisma.syncHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SyncHistoryUpdateManyArgs>(args: SelectSubset<T, SyncHistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one SyncHistory.
     * @param {SyncHistoryUpsertArgs} args - Arguments to update or create a SyncHistory.
     * @example
     * // Update or create a SyncHistory
     * const syncHistory = await prisma.syncHistory.upsert({
     *   create: {
     *     // ... data to create a SyncHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SyncHistory we want to update
     *   }
     * })
     */
    upsert<T extends SyncHistoryUpsertArgs>(args: SelectSubset<T, SyncHistoryUpsertArgs<ExtArgs>>): Prisma__SyncHistoryClient<$Result.GetResult<Prisma.$SyncHistoryPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of SyncHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncHistoryCountArgs} args - Arguments to filter SyncHistories to count.
     * @example
     * // Count the number of SyncHistories
     * const count = await prisma.syncHistory.count({
     *   where: {
     *     // ... the filter for the SyncHistories we want to count
     *   }
     * })
    **/
    count<T extends SyncHistoryCountArgs>(
      args?: Subset<T, SyncHistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SyncHistoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SyncHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SyncHistoryAggregateArgs>(args: Subset<T, SyncHistoryAggregateArgs>): Prisma.PrismaPromise<GetSyncHistoryAggregateType<T>>

    /**
     * Group by SyncHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncHistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SyncHistoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SyncHistoryGroupByArgs['orderBy'] }
        : { orderBy?: SyncHistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SyncHistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSyncHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SyncHistory model
   */
  readonly fields: SyncHistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SyncHistory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SyncHistoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SyncHistory model
   */ 
  interface SyncHistoryFieldRefs {
    readonly id: FieldRef<"SyncHistory", 'String'>
    readonly syncType: FieldRef<"SyncHistory", 'String'>
    readonly entityType: FieldRef<"SyncHistory", 'String'>
    readonly entityId: FieldRef<"SyncHistory", 'String'>
    readonly externalId: FieldRef<"SyncHistory", 'String'>
    readonly status: FieldRef<"SyncHistory", 'String'>
    readonly errorMessage: FieldRef<"SyncHistory", 'String'>
    readonly itemsProcessed: FieldRef<"SyncHistory", 'Int'>
    readonly startedAt: FieldRef<"SyncHistory", 'DateTime'>
    readonly completedAt: FieldRef<"SyncHistory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SyncHistory findUnique
   */
  export type SyncHistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncHistory
     */
    select?: SyncHistorySelect<ExtArgs> | null
    /**
     * Filter, which SyncHistory to fetch.
     */
    where: SyncHistoryWhereUniqueInput
  }

  /**
   * SyncHistory findUniqueOrThrow
   */
  export type SyncHistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncHistory
     */
    select?: SyncHistorySelect<ExtArgs> | null
    /**
     * Filter, which SyncHistory to fetch.
     */
    where: SyncHistoryWhereUniqueInput
  }

  /**
   * SyncHistory findFirst
   */
  export type SyncHistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncHistory
     */
    select?: SyncHistorySelect<ExtArgs> | null
    /**
     * Filter, which SyncHistory to fetch.
     */
    where?: SyncHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncHistories to fetch.
     */
    orderBy?: SyncHistoryOrderByWithRelationInput | SyncHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SyncHistories.
     */
    cursor?: SyncHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncHistories.
     */
    distinct?: SyncHistoryScalarFieldEnum | SyncHistoryScalarFieldEnum[]
  }

  /**
   * SyncHistory findFirstOrThrow
   */
  export type SyncHistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncHistory
     */
    select?: SyncHistorySelect<ExtArgs> | null
    /**
     * Filter, which SyncHistory to fetch.
     */
    where?: SyncHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncHistories to fetch.
     */
    orderBy?: SyncHistoryOrderByWithRelationInput | SyncHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SyncHistories.
     */
    cursor?: SyncHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncHistories.
     */
    distinct?: SyncHistoryScalarFieldEnum | SyncHistoryScalarFieldEnum[]
  }

  /**
   * SyncHistory findMany
   */
  export type SyncHistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncHistory
     */
    select?: SyncHistorySelect<ExtArgs> | null
    /**
     * Filter, which SyncHistories to fetch.
     */
    where?: SyncHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncHistories to fetch.
     */
    orderBy?: SyncHistoryOrderByWithRelationInput | SyncHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SyncHistories.
     */
    cursor?: SyncHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncHistories.
     */
    skip?: number
    distinct?: SyncHistoryScalarFieldEnum | SyncHistoryScalarFieldEnum[]
  }

  /**
   * SyncHistory create
   */
  export type SyncHistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncHistory
     */
    select?: SyncHistorySelect<ExtArgs> | null
    /**
     * The data needed to create a SyncHistory.
     */
    data: XOR<SyncHistoryCreateInput, SyncHistoryUncheckedCreateInput>
  }

  /**
   * SyncHistory createMany
   */
  export type SyncHistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SyncHistories.
     */
    data: SyncHistoryCreateManyInput | SyncHistoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SyncHistory createManyAndReturn
   */
  export type SyncHistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncHistory
     */
    select?: SyncHistorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many SyncHistories.
     */
    data: SyncHistoryCreateManyInput | SyncHistoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SyncHistory update
   */
  export type SyncHistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncHistory
     */
    select?: SyncHistorySelect<ExtArgs> | null
    /**
     * The data needed to update a SyncHistory.
     */
    data: XOR<SyncHistoryUpdateInput, SyncHistoryUncheckedUpdateInput>
    /**
     * Choose, which SyncHistory to update.
     */
    where: SyncHistoryWhereUniqueInput
  }

  /**
   * SyncHistory updateMany
   */
  export type SyncHistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SyncHistories.
     */
    data: XOR<SyncHistoryUpdateManyMutationInput, SyncHistoryUncheckedUpdateManyInput>
    /**
     * Filter which SyncHistories to update
     */
    where?: SyncHistoryWhereInput
  }

  /**
   * SyncHistory upsert
   */
  export type SyncHistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncHistory
     */
    select?: SyncHistorySelect<ExtArgs> | null
    /**
     * The filter to search for the SyncHistory to update in case it exists.
     */
    where: SyncHistoryWhereUniqueInput
    /**
     * In case the SyncHistory found by the `where` argument doesn't exist, create a new SyncHistory with this data.
     */
    create: XOR<SyncHistoryCreateInput, SyncHistoryUncheckedCreateInput>
    /**
     * In case the SyncHistory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SyncHistoryUpdateInput, SyncHistoryUncheckedUpdateInput>
  }

  /**
   * SyncHistory delete
   */
  export type SyncHistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncHistory
     */
    select?: SyncHistorySelect<ExtArgs> | null
    /**
     * Filter which SyncHistory to delete.
     */
    where: SyncHistoryWhereUniqueInput
  }

  /**
   * SyncHistory deleteMany
   */
  export type SyncHistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SyncHistories to delete
     */
    where?: SyncHistoryWhereInput
  }

  /**
   * SyncHistory without action
   */
  export type SyncHistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncHistory
     */
    select?: SyncHistorySelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ArtistScalarFieldEnum: {
    id: 'id',
    spotifyId: 'spotifyId',
    ticketmasterId: 'ticketmasterId',
    setlistfmMbid: 'setlistfmMbid',
    name: 'name',
    slug: 'slug',
    imageUrl: 'imageUrl',
    genres: 'genres',
    popularity: 'popularity',
    followers: 'followers',
    lastSyncedAt: 'lastSyncedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ArtistScalarFieldEnum = (typeof ArtistScalarFieldEnum)[keyof typeof ArtistScalarFieldEnum]


  export const VenueScalarFieldEnum: {
    id: 'id',
    ticketmasterId: 'ticketmasterId',
    setlistfmId: 'setlistfmId',
    name: 'name',
    address: 'address',
    city: 'city',
    state: 'state',
    country: 'country',
    postalCode: 'postalCode',
    latitude: 'latitude',
    longitude: 'longitude',
    timezone: 'timezone',
    capacity: 'capacity',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type VenueScalarFieldEnum = (typeof VenueScalarFieldEnum)[keyof typeof VenueScalarFieldEnum]


  export const ShowScalarFieldEnum: {
    id: 'id',
    artistId: 'artistId',
    venueId: 'venueId',
    ticketmasterId: 'ticketmasterId',
    setlistfmId: 'setlistfmId',
    date: 'date',
    startTime: 'startTime',
    doorsTime: 'doorsTime',
    title: 'title',
    tourName: 'tourName',
    status: 'status',
    ticketmasterUrl: 'ticketmasterUrl',
    viewCount: 'viewCount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ShowScalarFieldEnum = (typeof ShowScalarFieldEnum)[keyof typeof ShowScalarFieldEnum]


  export const SongScalarFieldEnum: {
    id: 'id',
    artistId: 'artistId',
    spotifyId: 'spotifyId',
    musicbrainzId: 'musicbrainzId',
    title: 'title',
    album: 'album',
    albumImageUrl: 'albumImageUrl',
    durationMs: 'durationMs',
    popularity: 'popularity',
    previewUrl: 'previewUrl',
    spotifyUrl: 'spotifyUrl',
    audioFeatures: 'audioFeatures',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SongScalarFieldEnum = (typeof SongScalarFieldEnum)[keyof typeof SongScalarFieldEnum]


  export const SetlistScalarFieldEnum: {
    id: 'id',
    showId: 'showId',
    name: 'name',
    orderIndex: 'orderIndex',
    isEncore: 'isEncore',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SetlistScalarFieldEnum = (typeof SetlistScalarFieldEnum)[keyof typeof SetlistScalarFieldEnum]


  export const SetlistSongScalarFieldEnum: {
    id: 'id',
    setlistId: 'setlistId',
    songId: 'songId',
    position: 'position',
    voteCount: 'voteCount',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SetlistSongScalarFieldEnum = (typeof SetlistSongScalarFieldEnum)[keyof typeof SetlistSongScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    displayName: 'displayName',
    avatarUrl: 'avatarUrl',
    spotifyId: 'spotifyId',
    preferences: 'preferences',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const VoteScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    setlistSongId: 'setlistSongId',
    showId: 'showId',
    voteType: 'voteType',
    createdAt: 'createdAt'
  };

  export type VoteScalarFieldEnum = (typeof VoteScalarFieldEnum)[keyof typeof VoteScalarFieldEnum]


  export const VoteAnalyticsScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    showId: 'showId',
    dailyVotes: 'dailyVotes',
    showVotes: 'showVotes',
    lastVoteAt: 'lastVoteAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type VoteAnalyticsScalarFieldEnum = (typeof VoteAnalyticsScalarFieldEnum)[keyof typeof VoteAnalyticsScalarFieldEnum]


  export const SyncHistoryScalarFieldEnum: {
    id: 'id',
    syncType: 'syncType',
    entityType: 'entityType',
    entityId: 'entityId',
    externalId: 'externalId',
    status: 'status',
    errorMessage: 'errorMessage',
    itemsProcessed: 'itemsProcessed',
    startedAt: 'startedAt',
    completedAt: 'completedAt'
  };

  export type SyncHistoryScalarFieldEnum = (typeof SyncHistoryScalarFieldEnum)[keyof typeof SyncHistoryScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type ArtistWhereInput = {
    AND?: ArtistWhereInput | ArtistWhereInput[]
    OR?: ArtistWhereInput[]
    NOT?: ArtistWhereInput | ArtistWhereInput[]
    id?: StringFilter<"Artist"> | string
    spotifyId?: StringNullableFilter<"Artist"> | string | null
    ticketmasterId?: StringNullableFilter<"Artist"> | string | null
    setlistfmMbid?: StringNullableFilter<"Artist"> | string | null
    name?: StringFilter<"Artist"> | string
    slug?: StringFilter<"Artist"> | string
    imageUrl?: StringNullableFilter<"Artist"> | string | null
    genres?: StringNullableListFilter<"Artist">
    popularity?: IntFilter<"Artist"> | number
    followers?: IntFilter<"Artist"> | number
    lastSyncedAt?: DateTimeFilter<"Artist"> | Date | string
    createdAt?: DateTimeFilter<"Artist"> | Date | string
    updatedAt?: DateTimeFilter<"Artist"> | Date | string
    shows?: ShowListRelationFilter
    songs?: SongListRelationFilter
  }

  export type ArtistOrderByWithRelationInput = {
    id?: SortOrder
    spotifyId?: SortOrderInput | SortOrder
    ticketmasterId?: SortOrderInput | SortOrder
    setlistfmMbid?: SortOrderInput | SortOrder
    name?: SortOrder
    slug?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    genres?: SortOrder
    popularity?: SortOrder
    followers?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    shows?: ShowOrderByRelationAggregateInput
    songs?: SongOrderByRelationAggregateInput
  }

  export type ArtistWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    spotifyId?: string
    setlistfmMbid?: string
    slug?: string
    spotifyId_ticketmasterId?: ArtistSpotifyIdTicketmasterIdCompoundUniqueInput
    AND?: ArtistWhereInput | ArtistWhereInput[]
    OR?: ArtistWhereInput[]
    NOT?: ArtistWhereInput | ArtistWhereInput[]
    ticketmasterId?: StringNullableFilter<"Artist"> | string | null
    name?: StringFilter<"Artist"> | string
    imageUrl?: StringNullableFilter<"Artist"> | string | null
    genres?: StringNullableListFilter<"Artist">
    popularity?: IntFilter<"Artist"> | number
    followers?: IntFilter<"Artist"> | number
    lastSyncedAt?: DateTimeFilter<"Artist"> | Date | string
    createdAt?: DateTimeFilter<"Artist"> | Date | string
    updatedAt?: DateTimeFilter<"Artist"> | Date | string
    shows?: ShowListRelationFilter
    songs?: SongListRelationFilter
  }, "id" | "spotifyId" | "setlistfmMbid" | "slug" | "spotifyId_ticketmasterId">

  export type ArtistOrderByWithAggregationInput = {
    id?: SortOrder
    spotifyId?: SortOrderInput | SortOrder
    ticketmasterId?: SortOrderInput | SortOrder
    setlistfmMbid?: SortOrderInput | SortOrder
    name?: SortOrder
    slug?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    genres?: SortOrder
    popularity?: SortOrder
    followers?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ArtistCountOrderByAggregateInput
    _avg?: ArtistAvgOrderByAggregateInput
    _max?: ArtistMaxOrderByAggregateInput
    _min?: ArtistMinOrderByAggregateInput
    _sum?: ArtistSumOrderByAggregateInput
  }

  export type ArtistScalarWhereWithAggregatesInput = {
    AND?: ArtistScalarWhereWithAggregatesInput | ArtistScalarWhereWithAggregatesInput[]
    OR?: ArtistScalarWhereWithAggregatesInput[]
    NOT?: ArtistScalarWhereWithAggregatesInput | ArtistScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Artist"> | string
    spotifyId?: StringNullableWithAggregatesFilter<"Artist"> | string | null
    ticketmasterId?: StringNullableWithAggregatesFilter<"Artist"> | string | null
    setlistfmMbid?: StringNullableWithAggregatesFilter<"Artist"> | string | null
    name?: StringWithAggregatesFilter<"Artist"> | string
    slug?: StringWithAggregatesFilter<"Artist"> | string
    imageUrl?: StringNullableWithAggregatesFilter<"Artist"> | string | null
    genres?: StringNullableListFilter<"Artist">
    popularity?: IntWithAggregatesFilter<"Artist"> | number
    followers?: IntWithAggregatesFilter<"Artist"> | number
    lastSyncedAt?: DateTimeWithAggregatesFilter<"Artist"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"Artist"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Artist"> | Date | string
  }

  export type VenueWhereInput = {
    AND?: VenueWhereInput | VenueWhereInput[]
    OR?: VenueWhereInput[]
    NOT?: VenueWhereInput | VenueWhereInput[]
    id?: StringFilter<"Venue"> | string
    ticketmasterId?: StringNullableFilter<"Venue"> | string | null
    setlistfmId?: StringNullableFilter<"Venue"> | string | null
    name?: StringFilter<"Venue"> | string
    address?: StringNullableFilter<"Venue"> | string | null
    city?: StringFilter<"Venue"> | string
    state?: StringNullableFilter<"Venue"> | string | null
    country?: StringFilter<"Venue"> | string
    postalCode?: StringNullableFilter<"Venue"> | string | null
    latitude?: DecimalNullableFilter<"Venue"> | Decimal | DecimalJsLike | number | string | null
    longitude?: DecimalNullableFilter<"Venue"> | Decimal | DecimalJsLike | number | string | null
    timezone?: StringNullableFilter<"Venue"> | string | null
    capacity?: IntNullableFilter<"Venue"> | number | null
    createdAt?: DateTimeFilter<"Venue"> | Date | string
    updatedAt?: DateTimeFilter<"Venue"> | Date | string
    shows?: ShowListRelationFilter
  }

  export type VenueOrderByWithRelationInput = {
    id?: SortOrder
    ticketmasterId?: SortOrderInput | SortOrder
    setlistfmId?: SortOrderInput | SortOrder
    name?: SortOrder
    address?: SortOrderInput | SortOrder
    city?: SortOrder
    state?: SortOrderInput | SortOrder
    country?: SortOrder
    postalCode?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    timezone?: SortOrderInput | SortOrder
    capacity?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    shows?: ShowOrderByRelationAggregateInput
  }

  export type VenueWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    ticketmasterId?: string
    setlistfmId?: string
    AND?: VenueWhereInput | VenueWhereInput[]
    OR?: VenueWhereInput[]
    NOT?: VenueWhereInput | VenueWhereInput[]
    name?: StringFilter<"Venue"> | string
    address?: StringNullableFilter<"Venue"> | string | null
    city?: StringFilter<"Venue"> | string
    state?: StringNullableFilter<"Venue"> | string | null
    country?: StringFilter<"Venue"> | string
    postalCode?: StringNullableFilter<"Venue"> | string | null
    latitude?: DecimalNullableFilter<"Venue"> | Decimal | DecimalJsLike | number | string | null
    longitude?: DecimalNullableFilter<"Venue"> | Decimal | DecimalJsLike | number | string | null
    timezone?: StringNullableFilter<"Venue"> | string | null
    capacity?: IntNullableFilter<"Venue"> | number | null
    createdAt?: DateTimeFilter<"Venue"> | Date | string
    updatedAt?: DateTimeFilter<"Venue"> | Date | string
    shows?: ShowListRelationFilter
  }, "id" | "ticketmasterId" | "setlistfmId">

  export type VenueOrderByWithAggregationInput = {
    id?: SortOrder
    ticketmasterId?: SortOrderInput | SortOrder
    setlistfmId?: SortOrderInput | SortOrder
    name?: SortOrder
    address?: SortOrderInput | SortOrder
    city?: SortOrder
    state?: SortOrderInput | SortOrder
    country?: SortOrder
    postalCode?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    timezone?: SortOrderInput | SortOrder
    capacity?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: VenueCountOrderByAggregateInput
    _avg?: VenueAvgOrderByAggregateInput
    _max?: VenueMaxOrderByAggregateInput
    _min?: VenueMinOrderByAggregateInput
    _sum?: VenueSumOrderByAggregateInput
  }

  export type VenueScalarWhereWithAggregatesInput = {
    AND?: VenueScalarWhereWithAggregatesInput | VenueScalarWhereWithAggregatesInput[]
    OR?: VenueScalarWhereWithAggregatesInput[]
    NOT?: VenueScalarWhereWithAggregatesInput | VenueScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Venue"> | string
    ticketmasterId?: StringNullableWithAggregatesFilter<"Venue"> | string | null
    setlistfmId?: StringNullableWithAggregatesFilter<"Venue"> | string | null
    name?: StringWithAggregatesFilter<"Venue"> | string
    address?: StringNullableWithAggregatesFilter<"Venue"> | string | null
    city?: StringWithAggregatesFilter<"Venue"> | string
    state?: StringNullableWithAggregatesFilter<"Venue"> | string | null
    country?: StringWithAggregatesFilter<"Venue"> | string
    postalCode?: StringNullableWithAggregatesFilter<"Venue"> | string | null
    latitude?: DecimalNullableWithAggregatesFilter<"Venue"> | Decimal | DecimalJsLike | number | string | null
    longitude?: DecimalNullableWithAggregatesFilter<"Venue"> | Decimal | DecimalJsLike | number | string | null
    timezone?: StringNullableWithAggregatesFilter<"Venue"> | string | null
    capacity?: IntNullableWithAggregatesFilter<"Venue"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"Venue"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Venue"> | Date | string
  }

  export type ShowWhereInput = {
    AND?: ShowWhereInput | ShowWhereInput[]
    OR?: ShowWhereInput[]
    NOT?: ShowWhereInput | ShowWhereInput[]
    id?: StringFilter<"Show"> | string
    artistId?: StringFilter<"Show"> | string
    venueId?: StringFilter<"Show"> | string
    ticketmasterId?: StringNullableFilter<"Show"> | string | null
    setlistfmId?: StringNullableFilter<"Show"> | string | null
    date?: DateTimeFilter<"Show"> | Date | string
    startTime?: DateTimeNullableFilter<"Show"> | Date | string | null
    doorsTime?: DateTimeNullableFilter<"Show"> | Date | string | null
    title?: StringNullableFilter<"Show"> | string | null
    tourName?: StringNullableFilter<"Show"> | string | null
    status?: StringFilter<"Show"> | string
    ticketmasterUrl?: StringNullableFilter<"Show"> | string | null
    viewCount?: IntFilter<"Show"> | number
    createdAt?: DateTimeFilter<"Show"> | Date | string
    updatedAt?: DateTimeFilter<"Show"> | Date | string
    artist?: XOR<ArtistRelationFilter, ArtistWhereInput>
    venue?: XOR<VenueRelationFilter, VenueWhereInput>
    setlists?: SetlistListRelationFilter
    votes?: VoteListRelationFilter
    voteAnalytics?: VoteAnalyticsListRelationFilter
  }

  export type ShowOrderByWithRelationInput = {
    id?: SortOrder
    artistId?: SortOrder
    venueId?: SortOrder
    ticketmasterId?: SortOrderInput | SortOrder
    setlistfmId?: SortOrderInput | SortOrder
    date?: SortOrder
    startTime?: SortOrderInput | SortOrder
    doorsTime?: SortOrderInput | SortOrder
    title?: SortOrderInput | SortOrder
    tourName?: SortOrderInput | SortOrder
    status?: SortOrder
    ticketmasterUrl?: SortOrderInput | SortOrder
    viewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    artist?: ArtistOrderByWithRelationInput
    venue?: VenueOrderByWithRelationInput
    setlists?: SetlistOrderByRelationAggregateInput
    votes?: VoteOrderByRelationAggregateInput
    voteAnalytics?: VoteAnalyticsOrderByRelationAggregateInput
  }

  export type ShowWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    ticketmasterId?: string
    setlistfmId?: string
    artistId_venueId_date?: ShowArtistIdVenueIdDateCompoundUniqueInput
    AND?: ShowWhereInput | ShowWhereInput[]
    OR?: ShowWhereInput[]
    NOT?: ShowWhereInput | ShowWhereInput[]
    artistId?: StringFilter<"Show"> | string
    venueId?: StringFilter<"Show"> | string
    date?: DateTimeFilter<"Show"> | Date | string
    startTime?: DateTimeNullableFilter<"Show"> | Date | string | null
    doorsTime?: DateTimeNullableFilter<"Show"> | Date | string | null
    title?: StringNullableFilter<"Show"> | string | null
    tourName?: StringNullableFilter<"Show"> | string | null
    status?: StringFilter<"Show"> | string
    ticketmasterUrl?: StringNullableFilter<"Show"> | string | null
    viewCount?: IntFilter<"Show"> | number
    createdAt?: DateTimeFilter<"Show"> | Date | string
    updatedAt?: DateTimeFilter<"Show"> | Date | string
    artist?: XOR<ArtistRelationFilter, ArtistWhereInput>
    venue?: XOR<VenueRelationFilter, VenueWhereInput>
    setlists?: SetlistListRelationFilter
    votes?: VoteListRelationFilter
    voteAnalytics?: VoteAnalyticsListRelationFilter
  }, "id" | "ticketmasterId" | "setlistfmId" | "artistId_venueId_date">

  export type ShowOrderByWithAggregationInput = {
    id?: SortOrder
    artistId?: SortOrder
    venueId?: SortOrder
    ticketmasterId?: SortOrderInput | SortOrder
    setlistfmId?: SortOrderInput | SortOrder
    date?: SortOrder
    startTime?: SortOrderInput | SortOrder
    doorsTime?: SortOrderInput | SortOrder
    title?: SortOrderInput | SortOrder
    tourName?: SortOrderInput | SortOrder
    status?: SortOrder
    ticketmasterUrl?: SortOrderInput | SortOrder
    viewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ShowCountOrderByAggregateInput
    _avg?: ShowAvgOrderByAggregateInput
    _max?: ShowMaxOrderByAggregateInput
    _min?: ShowMinOrderByAggregateInput
    _sum?: ShowSumOrderByAggregateInput
  }

  export type ShowScalarWhereWithAggregatesInput = {
    AND?: ShowScalarWhereWithAggregatesInput | ShowScalarWhereWithAggregatesInput[]
    OR?: ShowScalarWhereWithAggregatesInput[]
    NOT?: ShowScalarWhereWithAggregatesInput | ShowScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Show"> | string
    artistId?: StringWithAggregatesFilter<"Show"> | string
    venueId?: StringWithAggregatesFilter<"Show"> | string
    ticketmasterId?: StringNullableWithAggregatesFilter<"Show"> | string | null
    setlistfmId?: StringNullableWithAggregatesFilter<"Show"> | string | null
    date?: DateTimeWithAggregatesFilter<"Show"> | Date | string
    startTime?: DateTimeNullableWithAggregatesFilter<"Show"> | Date | string | null
    doorsTime?: DateTimeNullableWithAggregatesFilter<"Show"> | Date | string | null
    title?: StringNullableWithAggregatesFilter<"Show"> | string | null
    tourName?: StringNullableWithAggregatesFilter<"Show"> | string | null
    status?: StringWithAggregatesFilter<"Show"> | string
    ticketmasterUrl?: StringNullableWithAggregatesFilter<"Show"> | string | null
    viewCount?: IntWithAggregatesFilter<"Show"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Show"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Show"> | Date | string
  }

  export type SongWhereInput = {
    AND?: SongWhereInput | SongWhereInput[]
    OR?: SongWhereInput[]
    NOT?: SongWhereInput | SongWhereInput[]
    id?: StringFilter<"Song"> | string
    artistId?: StringFilter<"Song"> | string
    spotifyId?: StringNullableFilter<"Song"> | string | null
    musicbrainzId?: StringNullableFilter<"Song"> | string | null
    title?: StringFilter<"Song"> | string
    album?: StringNullableFilter<"Song"> | string | null
    albumImageUrl?: StringNullableFilter<"Song"> | string | null
    durationMs?: IntNullableFilter<"Song"> | number | null
    popularity?: IntFilter<"Song"> | number
    previewUrl?: StringNullableFilter<"Song"> | string | null
    spotifyUrl?: StringNullableFilter<"Song"> | string | null
    audioFeatures?: JsonNullableFilter<"Song">
    createdAt?: DateTimeFilter<"Song"> | Date | string
    updatedAt?: DateTimeFilter<"Song"> | Date | string
    artist?: XOR<ArtistRelationFilter, ArtistWhereInput>
    setlistSongs?: SetlistSongListRelationFilter
  }

  export type SongOrderByWithRelationInput = {
    id?: SortOrder
    artistId?: SortOrder
    spotifyId?: SortOrderInput | SortOrder
    musicbrainzId?: SortOrderInput | SortOrder
    title?: SortOrder
    album?: SortOrderInput | SortOrder
    albumImageUrl?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    popularity?: SortOrder
    previewUrl?: SortOrderInput | SortOrder
    spotifyUrl?: SortOrderInput | SortOrder
    audioFeatures?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    artist?: ArtistOrderByWithRelationInput
    setlistSongs?: SetlistSongOrderByRelationAggregateInput
  }

  export type SongWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    spotifyId?: string
    musicbrainzId?: string
    artistId_title_album?: SongArtistIdTitleAlbumCompoundUniqueInput
    AND?: SongWhereInput | SongWhereInput[]
    OR?: SongWhereInput[]
    NOT?: SongWhereInput | SongWhereInput[]
    artistId?: StringFilter<"Song"> | string
    title?: StringFilter<"Song"> | string
    album?: StringNullableFilter<"Song"> | string | null
    albumImageUrl?: StringNullableFilter<"Song"> | string | null
    durationMs?: IntNullableFilter<"Song"> | number | null
    popularity?: IntFilter<"Song"> | number
    previewUrl?: StringNullableFilter<"Song"> | string | null
    spotifyUrl?: StringNullableFilter<"Song"> | string | null
    audioFeatures?: JsonNullableFilter<"Song">
    createdAt?: DateTimeFilter<"Song"> | Date | string
    updatedAt?: DateTimeFilter<"Song"> | Date | string
    artist?: XOR<ArtistRelationFilter, ArtistWhereInput>
    setlistSongs?: SetlistSongListRelationFilter
  }, "id" | "spotifyId" | "musicbrainzId" | "artistId_title_album">

  export type SongOrderByWithAggregationInput = {
    id?: SortOrder
    artistId?: SortOrder
    spotifyId?: SortOrderInput | SortOrder
    musicbrainzId?: SortOrderInput | SortOrder
    title?: SortOrder
    album?: SortOrderInput | SortOrder
    albumImageUrl?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    popularity?: SortOrder
    previewUrl?: SortOrderInput | SortOrder
    spotifyUrl?: SortOrderInput | SortOrder
    audioFeatures?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SongCountOrderByAggregateInput
    _avg?: SongAvgOrderByAggregateInput
    _max?: SongMaxOrderByAggregateInput
    _min?: SongMinOrderByAggregateInput
    _sum?: SongSumOrderByAggregateInput
  }

  export type SongScalarWhereWithAggregatesInput = {
    AND?: SongScalarWhereWithAggregatesInput | SongScalarWhereWithAggregatesInput[]
    OR?: SongScalarWhereWithAggregatesInput[]
    NOT?: SongScalarWhereWithAggregatesInput | SongScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Song"> | string
    artistId?: StringWithAggregatesFilter<"Song"> | string
    spotifyId?: StringNullableWithAggregatesFilter<"Song"> | string | null
    musicbrainzId?: StringNullableWithAggregatesFilter<"Song"> | string | null
    title?: StringWithAggregatesFilter<"Song"> | string
    album?: StringNullableWithAggregatesFilter<"Song"> | string | null
    albumImageUrl?: StringNullableWithAggregatesFilter<"Song"> | string | null
    durationMs?: IntNullableWithAggregatesFilter<"Song"> | number | null
    popularity?: IntWithAggregatesFilter<"Song"> | number
    previewUrl?: StringNullableWithAggregatesFilter<"Song"> | string | null
    spotifyUrl?: StringNullableWithAggregatesFilter<"Song"> | string | null
    audioFeatures?: JsonNullableWithAggregatesFilter<"Song">
    createdAt?: DateTimeWithAggregatesFilter<"Song"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Song"> | Date | string
  }

  export type SetlistWhereInput = {
    AND?: SetlistWhereInput | SetlistWhereInput[]
    OR?: SetlistWhereInput[]
    NOT?: SetlistWhereInput | SetlistWhereInput[]
    id?: StringFilter<"Setlist"> | string
    showId?: StringFilter<"Setlist"> | string
    name?: StringFilter<"Setlist"> | string
    orderIndex?: IntFilter<"Setlist"> | number
    isEncore?: BoolFilter<"Setlist"> | boolean
    createdAt?: DateTimeFilter<"Setlist"> | Date | string
    updatedAt?: DateTimeFilter<"Setlist"> | Date | string
    show?: XOR<ShowRelationFilter, ShowWhereInput>
    setlistSongs?: SetlistSongListRelationFilter
  }

  export type SetlistOrderByWithRelationInput = {
    id?: SortOrder
    showId?: SortOrder
    name?: SortOrder
    orderIndex?: SortOrder
    isEncore?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    show?: ShowOrderByWithRelationInput
    setlistSongs?: SetlistSongOrderByRelationAggregateInput
  }

  export type SetlistWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    showId_orderIndex?: SetlistShowIdOrderIndexCompoundUniqueInput
    AND?: SetlistWhereInput | SetlistWhereInput[]
    OR?: SetlistWhereInput[]
    NOT?: SetlistWhereInput | SetlistWhereInput[]
    showId?: StringFilter<"Setlist"> | string
    name?: StringFilter<"Setlist"> | string
    orderIndex?: IntFilter<"Setlist"> | number
    isEncore?: BoolFilter<"Setlist"> | boolean
    createdAt?: DateTimeFilter<"Setlist"> | Date | string
    updatedAt?: DateTimeFilter<"Setlist"> | Date | string
    show?: XOR<ShowRelationFilter, ShowWhereInput>
    setlistSongs?: SetlistSongListRelationFilter
  }, "id" | "showId_orderIndex">

  export type SetlistOrderByWithAggregationInput = {
    id?: SortOrder
    showId?: SortOrder
    name?: SortOrder
    orderIndex?: SortOrder
    isEncore?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SetlistCountOrderByAggregateInput
    _avg?: SetlistAvgOrderByAggregateInput
    _max?: SetlistMaxOrderByAggregateInput
    _min?: SetlistMinOrderByAggregateInput
    _sum?: SetlistSumOrderByAggregateInput
  }

  export type SetlistScalarWhereWithAggregatesInput = {
    AND?: SetlistScalarWhereWithAggregatesInput | SetlistScalarWhereWithAggregatesInput[]
    OR?: SetlistScalarWhereWithAggregatesInput[]
    NOT?: SetlistScalarWhereWithAggregatesInput | SetlistScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Setlist"> | string
    showId?: StringWithAggregatesFilter<"Setlist"> | string
    name?: StringWithAggregatesFilter<"Setlist"> | string
    orderIndex?: IntWithAggregatesFilter<"Setlist"> | number
    isEncore?: BoolWithAggregatesFilter<"Setlist"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Setlist"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Setlist"> | Date | string
  }

  export type SetlistSongWhereInput = {
    AND?: SetlistSongWhereInput | SetlistSongWhereInput[]
    OR?: SetlistSongWhereInput[]
    NOT?: SetlistSongWhereInput | SetlistSongWhereInput[]
    id?: StringFilter<"SetlistSong"> | string
    setlistId?: StringFilter<"SetlistSong"> | string
    songId?: StringFilter<"SetlistSong"> | string
    position?: IntFilter<"SetlistSong"> | number
    voteCount?: IntFilter<"SetlistSong"> | number
    notes?: StringNullableFilter<"SetlistSong"> | string | null
    createdAt?: DateTimeFilter<"SetlistSong"> | Date | string
    updatedAt?: DateTimeFilter<"SetlistSong"> | Date | string
    setlist?: XOR<SetlistRelationFilter, SetlistWhereInput>
    song?: XOR<SongRelationFilter, SongWhereInput>
    votes?: VoteListRelationFilter
  }

  export type SetlistSongOrderByWithRelationInput = {
    id?: SortOrder
    setlistId?: SortOrder
    songId?: SortOrder
    position?: SortOrder
    voteCount?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    setlist?: SetlistOrderByWithRelationInput
    song?: SongOrderByWithRelationInput
    votes?: VoteOrderByRelationAggregateInput
  }

  export type SetlistSongWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    setlistId_position?: SetlistSongSetlistIdPositionCompoundUniqueInput
    setlistId_songId?: SetlistSongSetlistIdSongIdCompoundUniqueInput
    AND?: SetlistSongWhereInput | SetlistSongWhereInput[]
    OR?: SetlistSongWhereInput[]
    NOT?: SetlistSongWhereInput | SetlistSongWhereInput[]
    setlistId?: StringFilter<"SetlistSong"> | string
    songId?: StringFilter<"SetlistSong"> | string
    position?: IntFilter<"SetlistSong"> | number
    voteCount?: IntFilter<"SetlistSong"> | number
    notes?: StringNullableFilter<"SetlistSong"> | string | null
    createdAt?: DateTimeFilter<"SetlistSong"> | Date | string
    updatedAt?: DateTimeFilter<"SetlistSong"> | Date | string
    setlist?: XOR<SetlistRelationFilter, SetlistWhereInput>
    song?: XOR<SongRelationFilter, SongWhereInput>
    votes?: VoteListRelationFilter
  }, "id" | "setlistId_position" | "setlistId_songId">

  export type SetlistSongOrderByWithAggregationInput = {
    id?: SortOrder
    setlistId?: SortOrder
    songId?: SortOrder
    position?: SortOrder
    voteCount?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SetlistSongCountOrderByAggregateInput
    _avg?: SetlistSongAvgOrderByAggregateInput
    _max?: SetlistSongMaxOrderByAggregateInput
    _min?: SetlistSongMinOrderByAggregateInput
    _sum?: SetlistSongSumOrderByAggregateInput
  }

  export type SetlistSongScalarWhereWithAggregatesInput = {
    AND?: SetlistSongScalarWhereWithAggregatesInput | SetlistSongScalarWhereWithAggregatesInput[]
    OR?: SetlistSongScalarWhereWithAggregatesInput[]
    NOT?: SetlistSongScalarWhereWithAggregatesInput | SetlistSongScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SetlistSong"> | string
    setlistId?: StringWithAggregatesFilter<"SetlistSong"> | string
    songId?: StringWithAggregatesFilter<"SetlistSong"> | string
    position?: IntWithAggregatesFilter<"SetlistSong"> | number
    voteCount?: IntWithAggregatesFilter<"SetlistSong"> | number
    notes?: StringNullableWithAggregatesFilter<"SetlistSong"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SetlistSong"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SetlistSong"> | Date | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringNullableFilter<"User"> | string | null
    displayName?: StringNullableFilter<"User"> | string | null
    avatarUrl?: StringNullableFilter<"User"> | string | null
    spotifyId?: StringNullableFilter<"User"> | string | null
    preferences?: JsonFilter<"User">
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    votes?: VoteListRelationFilter
    voteAnalytics?: VoteAnalyticsListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrderInput | SortOrder
    displayName?: SortOrderInput | SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    spotifyId?: SortOrderInput | SortOrder
    preferences?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    votes?: VoteOrderByRelationAggregateInput
    voteAnalytics?: VoteAnalyticsOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    spotifyId?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    email?: StringNullableFilter<"User"> | string | null
    displayName?: StringNullableFilter<"User"> | string | null
    avatarUrl?: StringNullableFilter<"User"> | string | null
    preferences?: JsonFilter<"User">
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    votes?: VoteListRelationFilter
    voteAnalytics?: VoteAnalyticsListRelationFilter
  }, "id" | "spotifyId">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrderInput | SortOrder
    displayName?: SortOrderInput | SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    spotifyId?: SortOrderInput | SortOrder
    preferences?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringNullableWithAggregatesFilter<"User"> | string | null
    displayName?: StringNullableWithAggregatesFilter<"User"> | string | null
    avatarUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    spotifyId?: StringNullableWithAggregatesFilter<"User"> | string | null
    preferences?: JsonWithAggregatesFilter<"User">
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type VoteWhereInput = {
    AND?: VoteWhereInput | VoteWhereInput[]
    OR?: VoteWhereInput[]
    NOT?: VoteWhereInput | VoteWhereInput[]
    id?: StringFilter<"Vote"> | string
    userId?: StringFilter<"Vote"> | string
    setlistSongId?: StringFilter<"Vote"> | string
    showId?: StringFilter<"Vote"> | string
    voteType?: StringFilter<"Vote"> | string
    createdAt?: DateTimeFilter<"Vote"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    setlistSong?: XOR<SetlistSongRelationFilter, SetlistSongWhereInput>
    show?: XOR<ShowRelationFilter, ShowWhereInput>
  }

  export type VoteOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    setlistSongId?: SortOrder
    showId?: SortOrder
    voteType?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    setlistSong?: SetlistSongOrderByWithRelationInput
    show?: ShowOrderByWithRelationInput
  }

  export type VoteWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    unique_user_song_vote?: VoteUnique_user_song_voteCompoundUniqueInput
    AND?: VoteWhereInput | VoteWhereInput[]
    OR?: VoteWhereInput[]
    NOT?: VoteWhereInput | VoteWhereInput[]
    userId?: StringFilter<"Vote"> | string
    setlistSongId?: StringFilter<"Vote"> | string
    showId?: StringFilter<"Vote"> | string
    voteType?: StringFilter<"Vote"> | string
    createdAt?: DateTimeFilter<"Vote"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    setlistSong?: XOR<SetlistSongRelationFilter, SetlistSongWhereInput>
    show?: XOR<ShowRelationFilter, ShowWhereInput>
  }, "id" | "unique_user_song_vote">

  export type VoteOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    setlistSongId?: SortOrder
    showId?: SortOrder
    voteType?: SortOrder
    createdAt?: SortOrder
    _count?: VoteCountOrderByAggregateInput
    _max?: VoteMaxOrderByAggregateInput
    _min?: VoteMinOrderByAggregateInput
  }

  export type VoteScalarWhereWithAggregatesInput = {
    AND?: VoteScalarWhereWithAggregatesInput | VoteScalarWhereWithAggregatesInput[]
    OR?: VoteScalarWhereWithAggregatesInput[]
    NOT?: VoteScalarWhereWithAggregatesInput | VoteScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Vote"> | string
    userId?: StringWithAggregatesFilter<"Vote"> | string
    setlistSongId?: StringWithAggregatesFilter<"Vote"> | string
    showId?: StringWithAggregatesFilter<"Vote"> | string
    voteType?: StringWithAggregatesFilter<"Vote"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Vote"> | Date | string
  }

  export type VoteAnalyticsWhereInput = {
    AND?: VoteAnalyticsWhereInput | VoteAnalyticsWhereInput[]
    OR?: VoteAnalyticsWhereInput[]
    NOT?: VoteAnalyticsWhereInput | VoteAnalyticsWhereInput[]
    id?: StringFilter<"VoteAnalytics"> | string
    userId?: StringFilter<"VoteAnalytics"> | string
    showId?: StringFilter<"VoteAnalytics"> | string
    dailyVotes?: IntFilter<"VoteAnalytics"> | number
    showVotes?: IntFilter<"VoteAnalytics"> | number
    lastVoteAt?: DateTimeNullableFilter<"VoteAnalytics"> | Date | string | null
    createdAt?: DateTimeFilter<"VoteAnalytics"> | Date | string
    updatedAt?: DateTimeFilter<"VoteAnalytics"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    show?: XOR<ShowRelationFilter, ShowWhereInput>
  }

  export type VoteAnalyticsOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    showId?: SortOrder
    dailyVotes?: SortOrder
    showVotes?: SortOrder
    lastVoteAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    show?: ShowOrderByWithRelationInput
  }

  export type VoteAnalyticsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    unique_user_show_analytics?: VoteAnalyticsUnique_user_show_analyticsCompoundUniqueInput
    AND?: VoteAnalyticsWhereInput | VoteAnalyticsWhereInput[]
    OR?: VoteAnalyticsWhereInput[]
    NOT?: VoteAnalyticsWhereInput | VoteAnalyticsWhereInput[]
    userId?: StringFilter<"VoteAnalytics"> | string
    showId?: StringFilter<"VoteAnalytics"> | string
    dailyVotes?: IntFilter<"VoteAnalytics"> | number
    showVotes?: IntFilter<"VoteAnalytics"> | number
    lastVoteAt?: DateTimeNullableFilter<"VoteAnalytics"> | Date | string | null
    createdAt?: DateTimeFilter<"VoteAnalytics"> | Date | string
    updatedAt?: DateTimeFilter<"VoteAnalytics"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    show?: XOR<ShowRelationFilter, ShowWhereInput>
  }, "id" | "unique_user_show_analytics">

  export type VoteAnalyticsOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    showId?: SortOrder
    dailyVotes?: SortOrder
    showVotes?: SortOrder
    lastVoteAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: VoteAnalyticsCountOrderByAggregateInput
    _avg?: VoteAnalyticsAvgOrderByAggregateInput
    _max?: VoteAnalyticsMaxOrderByAggregateInput
    _min?: VoteAnalyticsMinOrderByAggregateInput
    _sum?: VoteAnalyticsSumOrderByAggregateInput
  }

  export type VoteAnalyticsScalarWhereWithAggregatesInput = {
    AND?: VoteAnalyticsScalarWhereWithAggregatesInput | VoteAnalyticsScalarWhereWithAggregatesInput[]
    OR?: VoteAnalyticsScalarWhereWithAggregatesInput[]
    NOT?: VoteAnalyticsScalarWhereWithAggregatesInput | VoteAnalyticsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"VoteAnalytics"> | string
    userId?: StringWithAggregatesFilter<"VoteAnalytics"> | string
    showId?: StringWithAggregatesFilter<"VoteAnalytics"> | string
    dailyVotes?: IntWithAggregatesFilter<"VoteAnalytics"> | number
    showVotes?: IntWithAggregatesFilter<"VoteAnalytics"> | number
    lastVoteAt?: DateTimeNullableWithAggregatesFilter<"VoteAnalytics"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"VoteAnalytics"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"VoteAnalytics"> | Date | string
  }

  export type SyncHistoryWhereInput = {
    AND?: SyncHistoryWhereInput | SyncHistoryWhereInput[]
    OR?: SyncHistoryWhereInput[]
    NOT?: SyncHistoryWhereInput | SyncHistoryWhereInput[]
    id?: StringFilter<"SyncHistory"> | string
    syncType?: StringFilter<"SyncHistory"> | string
    entityType?: StringFilter<"SyncHistory"> | string
    entityId?: StringNullableFilter<"SyncHistory"> | string | null
    externalId?: StringNullableFilter<"SyncHistory"> | string | null
    status?: StringFilter<"SyncHistory"> | string
    errorMessage?: StringNullableFilter<"SyncHistory"> | string | null
    itemsProcessed?: IntFilter<"SyncHistory"> | number
    startedAt?: DateTimeFilter<"SyncHistory"> | Date | string
    completedAt?: DateTimeNullableFilter<"SyncHistory"> | Date | string | null
  }

  export type SyncHistoryOrderByWithRelationInput = {
    id?: SortOrder
    syncType?: SortOrder
    entityType?: SortOrder
    entityId?: SortOrderInput | SortOrder
    externalId?: SortOrderInput | SortOrder
    status?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    itemsProcessed?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
  }

  export type SyncHistoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SyncHistoryWhereInput | SyncHistoryWhereInput[]
    OR?: SyncHistoryWhereInput[]
    NOT?: SyncHistoryWhereInput | SyncHistoryWhereInput[]
    syncType?: StringFilter<"SyncHistory"> | string
    entityType?: StringFilter<"SyncHistory"> | string
    entityId?: StringNullableFilter<"SyncHistory"> | string | null
    externalId?: StringNullableFilter<"SyncHistory"> | string | null
    status?: StringFilter<"SyncHistory"> | string
    errorMessage?: StringNullableFilter<"SyncHistory"> | string | null
    itemsProcessed?: IntFilter<"SyncHistory"> | number
    startedAt?: DateTimeFilter<"SyncHistory"> | Date | string
    completedAt?: DateTimeNullableFilter<"SyncHistory"> | Date | string | null
  }, "id">

  export type SyncHistoryOrderByWithAggregationInput = {
    id?: SortOrder
    syncType?: SortOrder
    entityType?: SortOrder
    entityId?: SortOrderInput | SortOrder
    externalId?: SortOrderInput | SortOrder
    status?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    itemsProcessed?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    _count?: SyncHistoryCountOrderByAggregateInput
    _avg?: SyncHistoryAvgOrderByAggregateInput
    _max?: SyncHistoryMaxOrderByAggregateInput
    _min?: SyncHistoryMinOrderByAggregateInput
    _sum?: SyncHistorySumOrderByAggregateInput
  }

  export type SyncHistoryScalarWhereWithAggregatesInput = {
    AND?: SyncHistoryScalarWhereWithAggregatesInput | SyncHistoryScalarWhereWithAggregatesInput[]
    OR?: SyncHistoryScalarWhereWithAggregatesInput[]
    NOT?: SyncHistoryScalarWhereWithAggregatesInput | SyncHistoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SyncHistory"> | string
    syncType?: StringWithAggregatesFilter<"SyncHistory"> | string
    entityType?: StringWithAggregatesFilter<"SyncHistory"> | string
    entityId?: StringNullableWithAggregatesFilter<"SyncHistory"> | string | null
    externalId?: StringNullableWithAggregatesFilter<"SyncHistory"> | string | null
    status?: StringWithAggregatesFilter<"SyncHistory"> | string
    errorMessage?: StringNullableWithAggregatesFilter<"SyncHistory"> | string | null
    itemsProcessed?: IntWithAggregatesFilter<"SyncHistory"> | number
    startedAt?: DateTimeWithAggregatesFilter<"SyncHistory"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"SyncHistory"> | Date | string | null
  }

  export type ArtistCreateInput = {
    id?: string
    spotifyId?: string | null
    ticketmasterId?: string | null
    setlistfmMbid?: string | null
    name: string
    slug: string
    imageUrl?: string | null
    genres?: ArtistCreategenresInput | string[]
    popularity?: number
    followers?: number
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    shows?: ShowCreateNestedManyWithoutArtistInput
    songs?: SongCreateNestedManyWithoutArtistInput
  }

  export type ArtistUncheckedCreateInput = {
    id?: string
    spotifyId?: string | null
    ticketmasterId?: string | null
    setlistfmMbid?: string | null
    name: string
    slug: string
    imageUrl?: string | null
    genres?: ArtistCreategenresInput | string[]
    popularity?: number
    followers?: number
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    shows?: ShowUncheckedCreateNestedManyWithoutArtistInput
    songs?: SongUncheckedCreateNestedManyWithoutArtistInput
  }

  export type ArtistUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmMbid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    genres?: ArtistUpdategenresInput | string[]
    popularity?: IntFieldUpdateOperationsInput | number
    followers?: IntFieldUpdateOperationsInput | number
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shows?: ShowUpdateManyWithoutArtistNestedInput
    songs?: SongUpdateManyWithoutArtistNestedInput
  }

  export type ArtistUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmMbid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    genres?: ArtistUpdategenresInput | string[]
    popularity?: IntFieldUpdateOperationsInput | number
    followers?: IntFieldUpdateOperationsInput | number
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shows?: ShowUncheckedUpdateManyWithoutArtistNestedInput
    songs?: SongUncheckedUpdateManyWithoutArtistNestedInput
  }

  export type ArtistCreateManyInput = {
    id?: string
    spotifyId?: string | null
    ticketmasterId?: string | null
    setlistfmMbid?: string | null
    name: string
    slug: string
    imageUrl?: string | null
    genres?: ArtistCreategenresInput | string[]
    popularity?: number
    followers?: number
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ArtistUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmMbid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    genres?: ArtistUpdategenresInput | string[]
    popularity?: IntFieldUpdateOperationsInput | number
    followers?: IntFieldUpdateOperationsInput | number
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtistUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmMbid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    genres?: ArtistUpdategenresInput | string[]
    popularity?: IntFieldUpdateOperationsInput | number
    followers?: IntFieldUpdateOperationsInput | number
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VenueCreateInput = {
    id?: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    name: string
    address?: string | null
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    timezone?: string | null
    capacity?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    shows?: ShowCreateNestedManyWithoutVenueInput
  }

  export type VenueUncheckedCreateInput = {
    id?: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    name: string
    address?: string | null
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    timezone?: string | null
    capacity?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    shows?: ShowUncheckedCreateNestedManyWithoutVenueInput
  }

  export type VenueUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    timezone?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shows?: ShowUpdateManyWithoutVenueNestedInput
  }

  export type VenueUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    timezone?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shows?: ShowUncheckedUpdateManyWithoutVenueNestedInput
  }

  export type VenueCreateManyInput = {
    id?: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    name: string
    address?: string | null
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    timezone?: string | null
    capacity?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VenueUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    timezone?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VenueUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    timezone?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShowCreateInput = {
    id?: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    artist: ArtistCreateNestedOneWithoutShowsInput
    venue: VenueCreateNestedOneWithoutShowsInput
    setlists?: SetlistCreateNestedManyWithoutShowInput
    votes?: VoteCreateNestedManyWithoutShowInput
    voteAnalytics?: VoteAnalyticsCreateNestedManyWithoutShowInput
  }

  export type ShowUncheckedCreateInput = {
    id?: string
    artistId: string
    venueId: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    setlists?: SetlistUncheckedCreateNestedManyWithoutShowInput
    votes?: VoteUncheckedCreateNestedManyWithoutShowInput
    voteAnalytics?: VoteAnalyticsUncheckedCreateNestedManyWithoutShowInput
  }

  export type ShowUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artist?: ArtistUpdateOneRequiredWithoutShowsNestedInput
    venue?: VenueUpdateOneRequiredWithoutShowsNestedInput
    setlists?: SetlistUpdateManyWithoutShowNestedInput
    votes?: VoteUpdateManyWithoutShowNestedInput
    voteAnalytics?: VoteAnalyticsUpdateManyWithoutShowNestedInput
  }

  export type ShowUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    artistId?: StringFieldUpdateOperationsInput | string
    venueId?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlists?: SetlistUncheckedUpdateManyWithoutShowNestedInput
    votes?: VoteUncheckedUpdateManyWithoutShowNestedInput
    voteAnalytics?: VoteAnalyticsUncheckedUpdateManyWithoutShowNestedInput
  }

  export type ShowCreateManyInput = {
    id?: string
    artistId: string
    venueId: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ShowUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShowUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    artistId?: StringFieldUpdateOperationsInput | string
    venueId?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SongCreateInput = {
    id?: string
    spotifyId?: string | null
    musicbrainzId?: string | null
    title: string
    album?: string | null
    albumImageUrl?: string | null
    durationMs?: number | null
    popularity?: number
    previewUrl?: string | null
    spotifyUrl?: string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    artist: ArtistCreateNestedOneWithoutSongsInput
    setlistSongs?: SetlistSongCreateNestedManyWithoutSongInput
  }

  export type SongUncheckedCreateInput = {
    id?: string
    artistId: string
    spotifyId?: string | null
    musicbrainzId?: string | null
    title: string
    album?: string | null
    albumImageUrl?: string | null
    durationMs?: number | null
    popularity?: number
    previewUrl?: string | null
    spotifyUrl?: string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    setlistSongs?: SetlistSongUncheckedCreateNestedManyWithoutSongInput
  }

  export type SongUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    musicbrainzId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    album?: NullableStringFieldUpdateOperationsInput | string | null
    albumImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    popularity?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyUrl?: NullableStringFieldUpdateOperationsInput | string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artist?: ArtistUpdateOneRequiredWithoutSongsNestedInput
    setlistSongs?: SetlistSongUpdateManyWithoutSongNestedInput
  }

  export type SongUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    artistId?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    musicbrainzId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    album?: NullableStringFieldUpdateOperationsInput | string | null
    albumImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    popularity?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyUrl?: NullableStringFieldUpdateOperationsInput | string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlistSongs?: SetlistSongUncheckedUpdateManyWithoutSongNestedInput
  }

  export type SongCreateManyInput = {
    id?: string
    artistId: string
    spotifyId?: string | null
    musicbrainzId?: string | null
    title: string
    album?: string | null
    albumImageUrl?: string | null
    durationMs?: number | null
    popularity?: number
    previewUrl?: string | null
    spotifyUrl?: string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SongUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    musicbrainzId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    album?: NullableStringFieldUpdateOperationsInput | string | null
    albumImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    popularity?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyUrl?: NullableStringFieldUpdateOperationsInput | string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SongUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    artistId?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    musicbrainzId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    album?: NullableStringFieldUpdateOperationsInput | string | null
    albumImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    popularity?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyUrl?: NullableStringFieldUpdateOperationsInput | string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SetlistCreateInput = {
    id?: string
    name?: string
    orderIndex?: number
    isEncore?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    show: ShowCreateNestedOneWithoutSetlistsInput
    setlistSongs?: SetlistSongCreateNestedManyWithoutSetlistInput
  }

  export type SetlistUncheckedCreateInput = {
    id?: string
    showId: string
    name?: string
    orderIndex?: number
    isEncore?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    setlistSongs?: SetlistSongUncheckedCreateNestedManyWithoutSetlistInput
  }

  export type SetlistUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    orderIndex?: IntFieldUpdateOperationsInput | number
    isEncore?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    show?: ShowUpdateOneRequiredWithoutSetlistsNestedInput
    setlistSongs?: SetlistSongUpdateManyWithoutSetlistNestedInput
  }

  export type SetlistUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    orderIndex?: IntFieldUpdateOperationsInput | number
    isEncore?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlistSongs?: SetlistSongUncheckedUpdateManyWithoutSetlistNestedInput
  }

  export type SetlistCreateManyInput = {
    id?: string
    showId: string
    name?: string
    orderIndex?: number
    isEncore?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SetlistUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    orderIndex?: IntFieldUpdateOperationsInput | number
    isEncore?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SetlistUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    orderIndex?: IntFieldUpdateOperationsInput | number
    isEncore?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SetlistSongCreateInput = {
    id?: string
    position: number
    voteCount?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    setlist: SetlistCreateNestedOneWithoutSetlistSongsInput
    song: SongCreateNestedOneWithoutSetlistSongsInput
    votes?: VoteCreateNestedManyWithoutSetlistSongInput
  }

  export type SetlistSongUncheckedCreateInput = {
    id?: string
    setlistId: string
    songId: string
    position: number
    voteCount?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutSetlistSongInput
  }

  export type SetlistSongUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlist?: SetlistUpdateOneRequiredWithoutSetlistSongsNestedInput
    song?: SongUpdateOneRequiredWithoutSetlistSongsNestedInput
    votes?: VoteUpdateManyWithoutSetlistSongNestedInput
  }

  export type SetlistSongUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    setlistId?: StringFieldUpdateOperationsInput | string
    songId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutSetlistSongNestedInput
  }

  export type SetlistSongCreateManyInput = {
    id?: string
    setlistId: string
    songId: string
    position: number
    voteCount?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SetlistSongUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SetlistSongUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    setlistId?: StringFieldUpdateOperationsInput | string
    songId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email?: string | null
    displayName?: string | null
    avatarUrl?: string | null
    spotifyId?: string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    votes?: VoteCreateNestedManyWithoutUserInput
    voteAnalytics?: VoteAnalyticsCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email?: string | null
    displayName?: string | null
    avatarUrl?: string | null
    spotifyId?: string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutUserInput
    voteAnalytics?: VoteAnalyticsUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUpdateManyWithoutUserNestedInput
    voteAnalytics?: VoteAnalyticsUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutUserNestedInput
    voteAnalytics?: VoteAnalyticsUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email?: string | null
    displayName?: string | null
    avatarUrl?: string | null
    spotifyId?: string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteCreateInput = {
    id?: string
    voteType?: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutVotesInput
    setlistSong: SetlistSongCreateNestedOneWithoutVotesInput
    show: ShowCreateNestedOneWithoutVotesInput
  }

  export type VoteUncheckedCreateInput = {
    id?: string
    userId: string
    setlistSongId: string
    showId: string
    voteType?: string
    createdAt?: Date | string
  }

  export type VoteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutVotesNestedInput
    setlistSong?: SetlistSongUpdateOneRequiredWithoutVotesNestedInput
    show?: ShowUpdateOneRequiredWithoutVotesNestedInput
  }

  export type VoteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    setlistSongId?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteCreateManyInput = {
    id?: string
    userId: string
    setlistSongId: string
    showId: string
    voteType?: string
    createdAt?: Date | string
  }

  export type VoteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    setlistSongId?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteAnalyticsCreateInput = {
    id?: string
    dailyVotes?: number
    showVotes?: number
    lastVoteAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutVoteAnalyticsInput
    show: ShowCreateNestedOneWithoutVoteAnalyticsInput
  }

  export type VoteAnalyticsUncheckedCreateInput = {
    id?: string
    userId: string
    showId: string
    dailyVotes?: number
    showVotes?: number
    lastVoteAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VoteAnalyticsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    dailyVotes?: IntFieldUpdateOperationsInput | number
    showVotes?: IntFieldUpdateOperationsInput | number
    lastVoteAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutVoteAnalyticsNestedInput
    show?: ShowUpdateOneRequiredWithoutVoteAnalyticsNestedInput
  }

  export type VoteAnalyticsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    dailyVotes?: IntFieldUpdateOperationsInput | number
    showVotes?: IntFieldUpdateOperationsInput | number
    lastVoteAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteAnalyticsCreateManyInput = {
    id?: string
    userId: string
    showId: string
    dailyVotes?: number
    showVotes?: number
    lastVoteAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VoteAnalyticsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    dailyVotes?: IntFieldUpdateOperationsInput | number
    showVotes?: IntFieldUpdateOperationsInput | number
    lastVoteAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteAnalyticsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    dailyVotes?: IntFieldUpdateOperationsInput | number
    showVotes?: IntFieldUpdateOperationsInput | number
    lastVoteAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncHistoryCreateInput = {
    id?: string
    syncType: string
    entityType: string
    entityId?: string | null
    externalId?: string | null
    status: string
    errorMessage?: string | null
    itemsProcessed?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type SyncHistoryUncheckedCreateInput = {
    id?: string
    syncType: string
    entityType: string
    entityId?: string | null
    externalId?: string | null
    status: string
    errorMessage?: string | null
    itemsProcessed?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type SyncHistoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    syncType?: StringFieldUpdateOperationsInput | string
    entityType?: StringFieldUpdateOperationsInput | string
    entityId?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    itemsProcessed?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type SyncHistoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    syncType?: StringFieldUpdateOperationsInput | string
    entityType?: StringFieldUpdateOperationsInput | string
    entityId?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    itemsProcessed?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type SyncHistoryCreateManyInput = {
    id?: string
    syncType: string
    entityType: string
    entityId?: string | null
    externalId?: string | null
    status: string
    errorMessage?: string | null
    itemsProcessed?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type SyncHistoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    syncType?: StringFieldUpdateOperationsInput | string
    entityType?: StringFieldUpdateOperationsInput | string
    entityId?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    itemsProcessed?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type SyncHistoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    syncType?: StringFieldUpdateOperationsInput | string
    entityType?: StringFieldUpdateOperationsInput | string
    entityId?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    itemsProcessed?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ShowListRelationFilter = {
    every?: ShowWhereInput
    some?: ShowWhereInput
    none?: ShowWhereInput
  }

  export type SongListRelationFilter = {
    every?: SongWhereInput
    some?: SongWhereInput
    none?: SongWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ShowOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SongOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ArtistSpotifyIdTicketmasterIdCompoundUniqueInput = {
    spotifyId: string
    ticketmasterId: string
  }

  export type ArtistCountOrderByAggregateInput = {
    id?: SortOrder
    spotifyId?: SortOrder
    ticketmasterId?: SortOrder
    setlistfmMbid?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    imageUrl?: SortOrder
    genres?: SortOrder
    popularity?: SortOrder
    followers?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ArtistAvgOrderByAggregateInput = {
    popularity?: SortOrder
    followers?: SortOrder
  }

  export type ArtistMaxOrderByAggregateInput = {
    id?: SortOrder
    spotifyId?: SortOrder
    ticketmasterId?: SortOrder
    setlistfmMbid?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    imageUrl?: SortOrder
    popularity?: SortOrder
    followers?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ArtistMinOrderByAggregateInput = {
    id?: SortOrder
    spotifyId?: SortOrder
    ticketmasterId?: SortOrder
    setlistfmMbid?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    imageUrl?: SortOrder
    popularity?: SortOrder
    followers?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ArtistSumOrderByAggregateInput = {
    popularity?: SortOrder
    followers?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type VenueCountOrderByAggregateInput = {
    id?: SortOrder
    ticketmasterId?: SortOrder
    setlistfmId?: SortOrder
    name?: SortOrder
    address?: SortOrder
    city?: SortOrder
    state?: SortOrder
    country?: SortOrder
    postalCode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    timezone?: SortOrder
    capacity?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VenueAvgOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
    capacity?: SortOrder
  }

  export type VenueMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketmasterId?: SortOrder
    setlistfmId?: SortOrder
    name?: SortOrder
    address?: SortOrder
    city?: SortOrder
    state?: SortOrder
    country?: SortOrder
    postalCode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    timezone?: SortOrder
    capacity?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VenueMinOrderByAggregateInput = {
    id?: SortOrder
    ticketmasterId?: SortOrder
    setlistfmId?: SortOrder
    name?: SortOrder
    address?: SortOrder
    city?: SortOrder
    state?: SortOrder
    country?: SortOrder
    postalCode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    timezone?: SortOrder
    capacity?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VenueSumOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
    capacity?: SortOrder
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type ArtistRelationFilter = {
    is?: ArtistWhereInput
    isNot?: ArtistWhereInput
  }

  export type VenueRelationFilter = {
    is?: VenueWhereInput
    isNot?: VenueWhereInput
  }

  export type SetlistListRelationFilter = {
    every?: SetlistWhereInput
    some?: SetlistWhereInput
    none?: SetlistWhereInput
  }

  export type VoteListRelationFilter = {
    every?: VoteWhereInput
    some?: VoteWhereInput
    none?: VoteWhereInput
  }

  export type VoteAnalyticsListRelationFilter = {
    every?: VoteAnalyticsWhereInput
    some?: VoteAnalyticsWhereInput
    none?: VoteAnalyticsWhereInput
  }

  export type SetlistOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VoteOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VoteAnalyticsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ShowArtistIdVenueIdDateCompoundUniqueInput = {
    artistId: string
    venueId: string
    date: Date | string
  }

  export type ShowCountOrderByAggregateInput = {
    id?: SortOrder
    artistId?: SortOrder
    venueId?: SortOrder
    ticketmasterId?: SortOrder
    setlistfmId?: SortOrder
    date?: SortOrder
    startTime?: SortOrder
    doorsTime?: SortOrder
    title?: SortOrder
    tourName?: SortOrder
    status?: SortOrder
    ticketmasterUrl?: SortOrder
    viewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ShowAvgOrderByAggregateInput = {
    viewCount?: SortOrder
  }

  export type ShowMaxOrderByAggregateInput = {
    id?: SortOrder
    artistId?: SortOrder
    venueId?: SortOrder
    ticketmasterId?: SortOrder
    setlistfmId?: SortOrder
    date?: SortOrder
    startTime?: SortOrder
    doorsTime?: SortOrder
    title?: SortOrder
    tourName?: SortOrder
    status?: SortOrder
    ticketmasterUrl?: SortOrder
    viewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ShowMinOrderByAggregateInput = {
    id?: SortOrder
    artistId?: SortOrder
    venueId?: SortOrder
    ticketmasterId?: SortOrder
    setlistfmId?: SortOrder
    date?: SortOrder
    startTime?: SortOrder
    doorsTime?: SortOrder
    title?: SortOrder
    tourName?: SortOrder
    status?: SortOrder
    ticketmasterUrl?: SortOrder
    viewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ShowSumOrderByAggregateInput = {
    viewCount?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type SetlistSongListRelationFilter = {
    every?: SetlistSongWhereInput
    some?: SetlistSongWhereInput
    none?: SetlistSongWhereInput
  }

  export type SetlistSongOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SongArtistIdTitleAlbumCompoundUniqueInput = {
    artistId: string
    title: string
    album: string
  }

  export type SongCountOrderByAggregateInput = {
    id?: SortOrder
    artistId?: SortOrder
    spotifyId?: SortOrder
    musicbrainzId?: SortOrder
    title?: SortOrder
    album?: SortOrder
    albumImageUrl?: SortOrder
    durationMs?: SortOrder
    popularity?: SortOrder
    previewUrl?: SortOrder
    spotifyUrl?: SortOrder
    audioFeatures?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SongAvgOrderByAggregateInput = {
    durationMs?: SortOrder
    popularity?: SortOrder
  }

  export type SongMaxOrderByAggregateInput = {
    id?: SortOrder
    artistId?: SortOrder
    spotifyId?: SortOrder
    musicbrainzId?: SortOrder
    title?: SortOrder
    album?: SortOrder
    albumImageUrl?: SortOrder
    durationMs?: SortOrder
    popularity?: SortOrder
    previewUrl?: SortOrder
    spotifyUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SongMinOrderByAggregateInput = {
    id?: SortOrder
    artistId?: SortOrder
    spotifyId?: SortOrder
    musicbrainzId?: SortOrder
    title?: SortOrder
    album?: SortOrder
    albumImageUrl?: SortOrder
    durationMs?: SortOrder
    popularity?: SortOrder
    previewUrl?: SortOrder
    spotifyUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SongSumOrderByAggregateInput = {
    durationMs?: SortOrder
    popularity?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type ShowRelationFilter = {
    is?: ShowWhereInput
    isNot?: ShowWhereInput
  }

  export type SetlistShowIdOrderIndexCompoundUniqueInput = {
    showId: string
    orderIndex: number
  }

  export type SetlistCountOrderByAggregateInput = {
    id?: SortOrder
    showId?: SortOrder
    name?: SortOrder
    orderIndex?: SortOrder
    isEncore?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SetlistAvgOrderByAggregateInput = {
    orderIndex?: SortOrder
  }

  export type SetlistMaxOrderByAggregateInput = {
    id?: SortOrder
    showId?: SortOrder
    name?: SortOrder
    orderIndex?: SortOrder
    isEncore?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SetlistMinOrderByAggregateInput = {
    id?: SortOrder
    showId?: SortOrder
    name?: SortOrder
    orderIndex?: SortOrder
    isEncore?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SetlistSumOrderByAggregateInput = {
    orderIndex?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type SetlistRelationFilter = {
    is?: SetlistWhereInput
    isNot?: SetlistWhereInput
  }

  export type SongRelationFilter = {
    is?: SongWhereInput
    isNot?: SongWhereInput
  }

  export type SetlistSongSetlistIdPositionCompoundUniqueInput = {
    setlistId: string
    position: number
  }

  export type SetlistSongSetlistIdSongIdCompoundUniqueInput = {
    setlistId: string
    songId: string
  }

  export type SetlistSongCountOrderByAggregateInput = {
    id?: SortOrder
    setlistId?: SortOrder
    songId?: SortOrder
    position?: SortOrder
    voteCount?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SetlistSongAvgOrderByAggregateInput = {
    position?: SortOrder
    voteCount?: SortOrder
  }

  export type SetlistSongMaxOrderByAggregateInput = {
    id?: SortOrder
    setlistId?: SortOrder
    songId?: SortOrder
    position?: SortOrder
    voteCount?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SetlistSongMinOrderByAggregateInput = {
    id?: SortOrder
    setlistId?: SortOrder
    songId?: SortOrder
    position?: SortOrder
    voteCount?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SetlistSongSumOrderByAggregateInput = {
    position?: SortOrder
    voteCount?: SortOrder
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    displayName?: SortOrder
    avatarUrl?: SortOrder
    spotifyId?: SortOrder
    preferences?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    displayName?: SortOrder
    avatarUrl?: SortOrder
    spotifyId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    displayName?: SortOrder
    avatarUrl?: SortOrder
    spotifyId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type UserRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type SetlistSongRelationFilter = {
    is?: SetlistSongWhereInput
    isNot?: SetlistSongWhereInput
  }

  export type VoteUnique_user_song_voteCompoundUniqueInput = {
    userId: string
    setlistSongId: string
  }

  export type VoteCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    setlistSongId?: SortOrder
    showId?: SortOrder
    voteType?: SortOrder
    createdAt?: SortOrder
  }

  export type VoteMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    setlistSongId?: SortOrder
    showId?: SortOrder
    voteType?: SortOrder
    createdAt?: SortOrder
  }

  export type VoteMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    setlistSongId?: SortOrder
    showId?: SortOrder
    voteType?: SortOrder
    createdAt?: SortOrder
  }

  export type VoteAnalyticsUnique_user_show_analyticsCompoundUniqueInput = {
    userId: string
    showId: string
  }

  export type VoteAnalyticsCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    showId?: SortOrder
    dailyVotes?: SortOrder
    showVotes?: SortOrder
    lastVoteAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VoteAnalyticsAvgOrderByAggregateInput = {
    dailyVotes?: SortOrder
    showVotes?: SortOrder
  }

  export type VoteAnalyticsMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    showId?: SortOrder
    dailyVotes?: SortOrder
    showVotes?: SortOrder
    lastVoteAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VoteAnalyticsMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    showId?: SortOrder
    dailyVotes?: SortOrder
    showVotes?: SortOrder
    lastVoteAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VoteAnalyticsSumOrderByAggregateInput = {
    dailyVotes?: SortOrder
    showVotes?: SortOrder
  }

  export type SyncHistoryCountOrderByAggregateInput = {
    id?: SortOrder
    syncType?: SortOrder
    entityType?: SortOrder
    entityId?: SortOrder
    externalId?: SortOrder
    status?: SortOrder
    errorMessage?: SortOrder
    itemsProcessed?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
  }

  export type SyncHistoryAvgOrderByAggregateInput = {
    itemsProcessed?: SortOrder
  }

  export type SyncHistoryMaxOrderByAggregateInput = {
    id?: SortOrder
    syncType?: SortOrder
    entityType?: SortOrder
    entityId?: SortOrder
    externalId?: SortOrder
    status?: SortOrder
    errorMessage?: SortOrder
    itemsProcessed?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
  }

  export type SyncHistoryMinOrderByAggregateInput = {
    id?: SortOrder
    syncType?: SortOrder
    entityType?: SortOrder
    entityId?: SortOrder
    externalId?: SortOrder
    status?: SortOrder
    errorMessage?: SortOrder
    itemsProcessed?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
  }

  export type SyncHistorySumOrderByAggregateInput = {
    itemsProcessed?: SortOrder
  }

  export type ArtistCreategenresInput = {
    set: string[]
  }

  export type ShowCreateNestedManyWithoutArtistInput = {
    create?: XOR<ShowCreateWithoutArtistInput, ShowUncheckedCreateWithoutArtistInput> | ShowCreateWithoutArtistInput[] | ShowUncheckedCreateWithoutArtistInput[]
    connectOrCreate?: ShowCreateOrConnectWithoutArtistInput | ShowCreateOrConnectWithoutArtistInput[]
    createMany?: ShowCreateManyArtistInputEnvelope
    connect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
  }

  export type SongCreateNestedManyWithoutArtistInput = {
    create?: XOR<SongCreateWithoutArtistInput, SongUncheckedCreateWithoutArtistInput> | SongCreateWithoutArtistInput[] | SongUncheckedCreateWithoutArtistInput[]
    connectOrCreate?: SongCreateOrConnectWithoutArtistInput | SongCreateOrConnectWithoutArtistInput[]
    createMany?: SongCreateManyArtistInputEnvelope
    connect?: SongWhereUniqueInput | SongWhereUniqueInput[]
  }

  export type ShowUncheckedCreateNestedManyWithoutArtistInput = {
    create?: XOR<ShowCreateWithoutArtistInput, ShowUncheckedCreateWithoutArtistInput> | ShowCreateWithoutArtistInput[] | ShowUncheckedCreateWithoutArtistInput[]
    connectOrCreate?: ShowCreateOrConnectWithoutArtistInput | ShowCreateOrConnectWithoutArtistInput[]
    createMany?: ShowCreateManyArtistInputEnvelope
    connect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
  }

  export type SongUncheckedCreateNestedManyWithoutArtistInput = {
    create?: XOR<SongCreateWithoutArtistInput, SongUncheckedCreateWithoutArtistInput> | SongCreateWithoutArtistInput[] | SongUncheckedCreateWithoutArtistInput[]
    connectOrCreate?: SongCreateOrConnectWithoutArtistInput | SongCreateOrConnectWithoutArtistInput[]
    createMany?: SongCreateManyArtistInputEnvelope
    connect?: SongWhereUniqueInput | SongWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type ArtistUpdategenresInput = {
    set?: string[]
    push?: string | string[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ShowUpdateManyWithoutArtistNestedInput = {
    create?: XOR<ShowCreateWithoutArtistInput, ShowUncheckedCreateWithoutArtistInput> | ShowCreateWithoutArtistInput[] | ShowUncheckedCreateWithoutArtistInput[]
    connectOrCreate?: ShowCreateOrConnectWithoutArtistInput | ShowCreateOrConnectWithoutArtistInput[]
    upsert?: ShowUpsertWithWhereUniqueWithoutArtistInput | ShowUpsertWithWhereUniqueWithoutArtistInput[]
    createMany?: ShowCreateManyArtistInputEnvelope
    set?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    disconnect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    delete?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    connect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    update?: ShowUpdateWithWhereUniqueWithoutArtistInput | ShowUpdateWithWhereUniqueWithoutArtistInput[]
    updateMany?: ShowUpdateManyWithWhereWithoutArtistInput | ShowUpdateManyWithWhereWithoutArtistInput[]
    deleteMany?: ShowScalarWhereInput | ShowScalarWhereInput[]
  }

  export type SongUpdateManyWithoutArtistNestedInput = {
    create?: XOR<SongCreateWithoutArtistInput, SongUncheckedCreateWithoutArtistInput> | SongCreateWithoutArtistInput[] | SongUncheckedCreateWithoutArtistInput[]
    connectOrCreate?: SongCreateOrConnectWithoutArtistInput | SongCreateOrConnectWithoutArtistInput[]
    upsert?: SongUpsertWithWhereUniqueWithoutArtistInput | SongUpsertWithWhereUniqueWithoutArtistInput[]
    createMany?: SongCreateManyArtistInputEnvelope
    set?: SongWhereUniqueInput | SongWhereUniqueInput[]
    disconnect?: SongWhereUniqueInput | SongWhereUniqueInput[]
    delete?: SongWhereUniqueInput | SongWhereUniqueInput[]
    connect?: SongWhereUniqueInput | SongWhereUniqueInput[]
    update?: SongUpdateWithWhereUniqueWithoutArtistInput | SongUpdateWithWhereUniqueWithoutArtistInput[]
    updateMany?: SongUpdateManyWithWhereWithoutArtistInput | SongUpdateManyWithWhereWithoutArtistInput[]
    deleteMany?: SongScalarWhereInput | SongScalarWhereInput[]
  }

  export type ShowUncheckedUpdateManyWithoutArtistNestedInput = {
    create?: XOR<ShowCreateWithoutArtistInput, ShowUncheckedCreateWithoutArtistInput> | ShowCreateWithoutArtistInput[] | ShowUncheckedCreateWithoutArtistInput[]
    connectOrCreate?: ShowCreateOrConnectWithoutArtistInput | ShowCreateOrConnectWithoutArtistInput[]
    upsert?: ShowUpsertWithWhereUniqueWithoutArtistInput | ShowUpsertWithWhereUniqueWithoutArtistInput[]
    createMany?: ShowCreateManyArtistInputEnvelope
    set?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    disconnect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    delete?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    connect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    update?: ShowUpdateWithWhereUniqueWithoutArtistInput | ShowUpdateWithWhereUniqueWithoutArtistInput[]
    updateMany?: ShowUpdateManyWithWhereWithoutArtistInput | ShowUpdateManyWithWhereWithoutArtistInput[]
    deleteMany?: ShowScalarWhereInput | ShowScalarWhereInput[]
  }

  export type SongUncheckedUpdateManyWithoutArtistNestedInput = {
    create?: XOR<SongCreateWithoutArtistInput, SongUncheckedCreateWithoutArtistInput> | SongCreateWithoutArtistInput[] | SongUncheckedCreateWithoutArtistInput[]
    connectOrCreate?: SongCreateOrConnectWithoutArtistInput | SongCreateOrConnectWithoutArtistInput[]
    upsert?: SongUpsertWithWhereUniqueWithoutArtistInput | SongUpsertWithWhereUniqueWithoutArtistInput[]
    createMany?: SongCreateManyArtistInputEnvelope
    set?: SongWhereUniqueInput | SongWhereUniqueInput[]
    disconnect?: SongWhereUniqueInput | SongWhereUniqueInput[]
    delete?: SongWhereUniqueInput | SongWhereUniqueInput[]
    connect?: SongWhereUniqueInput | SongWhereUniqueInput[]
    update?: SongUpdateWithWhereUniqueWithoutArtistInput | SongUpdateWithWhereUniqueWithoutArtistInput[]
    updateMany?: SongUpdateManyWithWhereWithoutArtistInput | SongUpdateManyWithWhereWithoutArtistInput[]
    deleteMany?: SongScalarWhereInput | SongScalarWhereInput[]
  }

  export type ShowCreateNestedManyWithoutVenueInput = {
    create?: XOR<ShowCreateWithoutVenueInput, ShowUncheckedCreateWithoutVenueInput> | ShowCreateWithoutVenueInput[] | ShowUncheckedCreateWithoutVenueInput[]
    connectOrCreate?: ShowCreateOrConnectWithoutVenueInput | ShowCreateOrConnectWithoutVenueInput[]
    createMany?: ShowCreateManyVenueInputEnvelope
    connect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
  }

  export type ShowUncheckedCreateNestedManyWithoutVenueInput = {
    create?: XOR<ShowCreateWithoutVenueInput, ShowUncheckedCreateWithoutVenueInput> | ShowCreateWithoutVenueInput[] | ShowUncheckedCreateWithoutVenueInput[]
    connectOrCreate?: ShowCreateOrConnectWithoutVenueInput | ShowCreateOrConnectWithoutVenueInput[]
    createMany?: ShowCreateManyVenueInputEnvelope
    connect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ShowUpdateManyWithoutVenueNestedInput = {
    create?: XOR<ShowCreateWithoutVenueInput, ShowUncheckedCreateWithoutVenueInput> | ShowCreateWithoutVenueInput[] | ShowUncheckedCreateWithoutVenueInput[]
    connectOrCreate?: ShowCreateOrConnectWithoutVenueInput | ShowCreateOrConnectWithoutVenueInput[]
    upsert?: ShowUpsertWithWhereUniqueWithoutVenueInput | ShowUpsertWithWhereUniqueWithoutVenueInput[]
    createMany?: ShowCreateManyVenueInputEnvelope
    set?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    disconnect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    delete?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    connect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    update?: ShowUpdateWithWhereUniqueWithoutVenueInput | ShowUpdateWithWhereUniqueWithoutVenueInput[]
    updateMany?: ShowUpdateManyWithWhereWithoutVenueInput | ShowUpdateManyWithWhereWithoutVenueInput[]
    deleteMany?: ShowScalarWhereInput | ShowScalarWhereInput[]
  }

  export type ShowUncheckedUpdateManyWithoutVenueNestedInput = {
    create?: XOR<ShowCreateWithoutVenueInput, ShowUncheckedCreateWithoutVenueInput> | ShowCreateWithoutVenueInput[] | ShowUncheckedCreateWithoutVenueInput[]
    connectOrCreate?: ShowCreateOrConnectWithoutVenueInput | ShowCreateOrConnectWithoutVenueInput[]
    upsert?: ShowUpsertWithWhereUniqueWithoutVenueInput | ShowUpsertWithWhereUniqueWithoutVenueInput[]
    createMany?: ShowCreateManyVenueInputEnvelope
    set?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    disconnect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    delete?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    connect?: ShowWhereUniqueInput | ShowWhereUniqueInput[]
    update?: ShowUpdateWithWhereUniqueWithoutVenueInput | ShowUpdateWithWhereUniqueWithoutVenueInput[]
    updateMany?: ShowUpdateManyWithWhereWithoutVenueInput | ShowUpdateManyWithWhereWithoutVenueInput[]
    deleteMany?: ShowScalarWhereInput | ShowScalarWhereInput[]
  }

  export type ArtistCreateNestedOneWithoutShowsInput = {
    create?: XOR<ArtistCreateWithoutShowsInput, ArtistUncheckedCreateWithoutShowsInput>
    connectOrCreate?: ArtistCreateOrConnectWithoutShowsInput
    connect?: ArtistWhereUniqueInput
  }

  export type VenueCreateNestedOneWithoutShowsInput = {
    create?: XOR<VenueCreateWithoutShowsInput, VenueUncheckedCreateWithoutShowsInput>
    connectOrCreate?: VenueCreateOrConnectWithoutShowsInput
    connect?: VenueWhereUniqueInput
  }

  export type SetlistCreateNestedManyWithoutShowInput = {
    create?: XOR<SetlistCreateWithoutShowInput, SetlistUncheckedCreateWithoutShowInput> | SetlistCreateWithoutShowInput[] | SetlistUncheckedCreateWithoutShowInput[]
    connectOrCreate?: SetlistCreateOrConnectWithoutShowInput | SetlistCreateOrConnectWithoutShowInput[]
    createMany?: SetlistCreateManyShowInputEnvelope
    connect?: SetlistWhereUniqueInput | SetlistWhereUniqueInput[]
  }

  export type VoteCreateNestedManyWithoutShowInput = {
    create?: XOR<VoteCreateWithoutShowInput, VoteUncheckedCreateWithoutShowInput> | VoteCreateWithoutShowInput[] | VoteUncheckedCreateWithoutShowInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutShowInput | VoteCreateOrConnectWithoutShowInput[]
    createMany?: VoteCreateManyShowInputEnvelope
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
  }

  export type VoteAnalyticsCreateNestedManyWithoutShowInput = {
    create?: XOR<VoteAnalyticsCreateWithoutShowInput, VoteAnalyticsUncheckedCreateWithoutShowInput> | VoteAnalyticsCreateWithoutShowInput[] | VoteAnalyticsUncheckedCreateWithoutShowInput[]
    connectOrCreate?: VoteAnalyticsCreateOrConnectWithoutShowInput | VoteAnalyticsCreateOrConnectWithoutShowInput[]
    createMany?: VoteAnalyticsCreateManyShowInputEnvelope
    connect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
  }

  export type SetlistUncheckedCreateNestedManyWithoutShowInput = {
    create?: XOR<SetlistCreateWithoutShowInput, SetlistUncheckedCreateWithoutShowInput> | SetlistCreateWithoutShowInput[] | SetlistUncheckedCreateWithoutShowInput[]
    connectOrCreate?: SetlistCreateOrConnectWithoutShowInput | SetlistCreateOrConnectWithoutShowInput[]
    createMany?: SetlistCreateManyShowInputEnvelope
    connect?: SetlistWhereUniqueInput | SetlistWhereUniqueInput[]
  }

  export type VoteUncheckedCreateNestedManyWithoutShowInput = {
    create?: XOR<VoteCreateWithoutShowInput, VoteUncheckedCreateWithoutShowInput> | VoteCreateWithoutShowInput[] | VoteUncheckedCreateWithoutShowInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutShowInput | VoteCreateOrConnectWithoutShowInput[]
    createMany?: VoteCreateManyShowInputEnvelope
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
  }

  export type VoteAnalyticsUncheckedCreateNestedManyWithoutShowInput = {
    create?: XOR<VoteAnalyticsCreateWithoutShowInput, VoteAnalyticsUncheckedCreateWithoutShowInput> | VoteAnalyticsCreateWithoutShowInput[] | VoteAnalyticsUncheckedCreateWithoutShowInput[]
    connectOrCreate?: VoteAnalyticsCreateOrConnectWithoutShowInput | VoteAnalyticsCreateOrConnectWithoutShowInput[]
    createMany?: VoteAnalyticsCreateManyShowInputEnvelope
    connect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type ArtistUpdateOneRequiredWithoutShowsNestedInput = {
    create?: XOR<ArtistCreateWithoutShowsInput, ArtistUncheckedCreateWithoutShowsInput>
    connectOrCreate?: ArtistCreateOrConnectWithoutShowsInput
    upsert?: ArtistUpsertWithoutShowsInput
    connect?: ArtistWhereUniqueInput
    update?: XOR<XOR<ArtistUpdateToOneWithWhereWithoutShowsInput, ArtistUpdateWithoutShowsInput>, ArtistUncheckedUpdateWithoutShowsInput>
  }

  export type VenueUpdateOneRequiredWithoutShowsNestedInput = {
    create?: XOR<VenueCreateWithoutShowsInput, VenueUncheckedCreateWithoutShowsInput>
    connectOrCreate?: VenueCreateOrConnectWithoutShowsInput
    upsert?: VenueUpsertWithoutShowsInput
    connect?: VenueWhereUniqueInput
    update?: XOR<XOR<VenueUpdateToOneWithWhereWithoutShowsInput, VenueUpdateWithoutShowsInput>, VenueUncheckedUpdateWithoutShowsInput>
  }

  export type SetlistUpdateManyWithoutShowNestedInput = {
    create?: XOR<SetlistCreateWithoutShowInput, SetlistUncheckedCreateWithoutShowInput> | SetlistCreateWithoutShowInput[] | SetlistUncheckedCreateWithoutShowInput[]
    connectOrCreate?: SetlistCreateOrConnectWithoutShowInput | SetlistCreateOrConnectWithoutShowInput[]
    upsert?: SetlistUpsertWithWhereUniqueWithoutShowInput | SetlistUpsertWithWhereUniqueWithoutShowInput[]
    createMany?: SetlistCreateManyShowInputEnvelope
    set?: SetlistWhereUniqueInput | SetlistWhereUniqueInput[]
    disconnect?: SetlistWhereUniqueInput | SetlistWhereUniqueInput[]
    delete?: SetlistWhereUniqueInput | SetlistWhereUniqueInput[]
    connect?: SetlistWhereUniqueInput | SetlistWhereUniqueInput[]
    update?: SetlistUpdateWithWhereUniqueWithoutShowInput | SetlistUpdateWithWhereUniqueWithoutShowInput[]
    updateMany?: SetlistUpdateManyWithWhereWithoutShowInput | SetlistUpdateManyWithWhereWithoutShowInput[]
    deleteMany?: SetlistScalarWhereInput | SetlistScalarWhereInput[]
  }

  export type VoteUpdateManyWithoutShowNestedInput = {
    create?: XOR<VoteCreateWithoutShowInput, VoteUncheckedCreateWithoutShowInput> | VoteCreateWithoutShowInput[] | VoteUncheckedCreateWithoutShowInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutShowInput | VoteCreateOrConnectWithoutShowInput[]
    upsert?: VoteUpsertWithWhereUniqueWithoutShowInput | VoteUpsertWithWhereUniqueWithoutShowInput[]
    createMany?: VoteCreateManyShowInputEnvelope
    set?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    disconnect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    delete?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    update?: VoteUpdateWithWhereUniqueWithoutShowInput | VoteUpdateWithWhereUniqueWithoutShowInput[]
    updateMany?: VoteUpdateManyWithWhereWithoutShowInput | VoteUpdateManyWithWhereWithoutShowInput[]
    deleteMany?: VoteScalarWhereInput | VoteScalarWhereInput[]
  }

  export type VoteAnalyticsUpdateManyWithoutShowNestedInput = {
    create?: XOR<VoteAnalyticsCreateWithoutShowInput, VoteAnalyticsUncheckedCreateWithoutShowInput> | VoteAnalyticsCreateWithoutShowInput[] | VoteAnalyticsUncheckedCreateWithoutShowInput[]
    connectOrCreate?: VoteAnalyticsCreateOrConnectWithoutShowInput | VoteAnalyticsCreateOrConnectWithoutShowInput[]
    upsert?: VoteAnalyticsUpsertWithWhereUniqueWithoutShowInput | VoteAnalyticsUpsertWithWhereUniqueWithoutShowInput[]
    createMany?: VoteAnalyticsCreateManyShowInputEnvelope
    set?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    disconnect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    delete?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    connect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    update?: VoteAnalyticsUpdateWithWhereUniqueWithoutShowInput | VoteAnalyticsUpdateWithWhereUniqueWithoutShowInput[]
    updateMany?: VoteAnalyticsUpdateManyWithWhereWithoutShowInput | VoteAnalyticsUpdateManyWithWhereWithoutShowInput[]
    deleteMany?: VoteAnalyticsScalarWhereInput | VoteAnalyticsScalarWhereInput[]
  }

  export type SetlistUncheckedUpdateManyWithoutShowNestedInput = {
    create?: XOR<SetlistCreateWithoutShowInput, SetlistUncheckedCreateWithoutShowInput> | SetlistCreateWithoutShowInput[] | SetlistUncheckedCreateWithoutShowInput[]
    connectOrCreate?: SetlistCreateOrConnectWithoutShowInput | SetlistCreateOrConnectWithoutShowInput[]
    upsert?: SetlistUpsertWithWhereUniqueWithoutShowInput | SetlistUpsertWithWhereUniqueWithoutShowInput[]
    createMany?: SetlistCreateManyShowInputEnvelope
    set?: SetlistWhereUniqueInput | SetlistWhereUniqueInput[]
    disconnect?: SetlistWhereUniqueInput | SetlistWhereUniqueInput[]
    delete?: SetlistWhereUniqueInput | SetlistWhereUniqueInput[]
    connect?: SetlistWhereUniqueInput | SetlistWhereUniqueInput[]
    update?: SetlistUpdateWithWhereUniqueWithoutShowInput | SetlistUpdateWithWhereUniqueWithoutShowInput[]
    updateMany?: SetlistUpdateManyWithWhereWithoutShowInput | SetlistUpdateManyWithWhereWithoutShowInput[]
    deleteMany?: SetlistScalarWhereInput | SetlistScalarWhereInput[]
  }

  export type VoteUncheckedUpdateManyWithoutShowNestedInput = {
    create?: XOR<VoteCreateWithoutShowInput, VoteUncheckedCreateWithoutShowInput> | VoteCreateWithoutShowInput[] | VoteUncheckedCreateWithoutShowInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutShowInput | VoteCreateOrConnectWithoutShowInput[]
    upsert?: VoteUpsertWithWhereUniqueWithoutShowInput | VoteUpsertWithWhereUniqueWithoutShowInput[]
    createMany?: VoteCreateManyShowInputEnvelope
    set?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    disconnect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    delete?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    update?: VoteUpdateWithWhereUniqueWithoutShowInput | VoteUpdateWithWhereUniqueWithoutShowInput[]
    updateMany?: VoteUpdateManyWithWhereWithoutShowInput | VoteUpdateManyWithWhereWithoutShowInput[]
    deleteMany?: VoteScalarWhereInput | VoteScalarWhereInput[]
  }

  export type VoteAnalyticsUncheckedUpdateManyWithoutShowNestedInput = {
    create?: XOR<VoteAnalyticsCreateWithoutShowInput, VoteAnalyticsUncheckedCreateWithoutShowInput> | VoteAnalyticsCreateWithoutShowInput[] | VoteAnalyticsUncheckedCreateWithoutShowInput[]
    connectOrCreate?: VoteAnalyticsCreateOrConnectWithoutShowInput | VoteAnalyticsCreateOrConnectWithoutShowInput[]
    upsert?: VoteAnalyticsUpsertWithWhereUniqueWithoutShowInput | VoteAnalyticsUpsertWithWhereUniqueWithoutShowInput[]
    createMany?: VoteAnalyticsCreateManyShowInputEnvelope
    set?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    disconnect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    delete?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    connect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    update?: VoteAnalyticsUpdateWithWhereUniqueWithoutShowInput | VoteAnalyticsUpdateWithWhereUniqueWithoutShowInput[]
    updateMany?: VoteAnalyticsUpdateManyWithWhereWithoutShowInput | VoteAnalyticsUpdateManyWithWhereWithoutShowInput[]
    deleteMany?: VoteAnalyticsScalarWhereInput | VoteAnalyticsScalarWhereInput[]
  }

  export type ArtistCreateNestedOneWithoutSongsInput = {
    create?: XOR<ArtistCreateWithoutSongsInput, ArtistUncheckedCreateWithoutSongsInput>
    connectOrCreate?: ArtistCreateOrConnectWithoutSongsInput
    connect?: ArtistWhereUniqueInput
  }

  export type SetlistSongCreateNestedManyWithoutSongInput = {
    create?: XOR<SetlistSongCreateWithoutSongInput, SetlistSongUncheckedCreateWithoutSongInput> | SetlistSongCreateWithoutSongInput[] | SetlistSongUncheckedCreateWithoutSongInput[]
    connectOrCreate?: SetlistSongCreateOrConnectWithoutSongInput | SetlistSongCreateOrConnectWithoutSongInput[]
    createMany?: SetlistSongCreateManySongInputEnvelope
    connect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
  }

  export type SetlistSongUncheckedCreateNestedManyWithoutSongInput = {
    create?: XOR<SetlistSongCreateWithoutSongInput, SetlistSongUncheckedCreateWithoutSongInput> | SetlistSongCreateWithoutSongInput[] | SetlistSongUncheckedCreateWithoutSongInput[]
    connectOrCreate?: SetlistSongCreateOrConnectWithoutSongInput | SetlistSongCreateOrConnectWithoutSongInput[]
    createMany?: SetlistSongCreateManySongInputEnvelope
    connect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
  }

  export type ArtistUpdateOneRequiredWithoutSongsNestedInput = {
    create?: XOR<ArtistCreateWithoutSongsInput, ArtistUncheckedCreateWithoutSongsInput>
    connectOrCreate?: ArtistCreateOrConnectWithoutSongsInput
    upsert?: ArtistUpsertWithoutSongsInput
    connect?: ArtistWhereUniqueInput
    update?: XOR<XOR<ArtistUpdateToOneWithWhereWithoutSongsInput, ArtistUpdateWithoutSongsInput>, ArtistUncheckedUpdateWithoutSongsInput>
  }

  export type SetlistSongUpdateManyWithoutSongNestedInput = {
    create?: XOR<SetlistSongCreateWithoutSongInput, SetlistSongUncheckedCreateWithoutSongInput> | SetlistSongCreateWithoutSongInput[] | SetlistSongUncheckedCreateWithoutSongInput[]
    connectOrCreate?: SetlistSongCreateOrConnectWithoutSongInput | SetlistSongCreateOrConnectWithoutSongInput[]
    upsert?: SetlistSongUpsertWithWhereUniqueWithoutSongInput | SetlistSongUpsertWithWhereUniqueWithoutSongInput[]
    createMany?: SetlistSongCreateManySongInputEnvelope
    set?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    disconnect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    delete?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    connect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    update?: SetlistSongUpdateWithWhereUniqueWithoutSongInput | SetlistSongUpdateWithWhereUniqueWithoutSongInput[]
    updateMany?: SetlistSongUpdateManyWithWhereWithoutSongInput | SetlistSongUpdateManyWithWhereWithoutSongInput[]
    deleteMany?: SetlistSongScalarWhereInput | SetlistSongScalarWhereInput[]
  }

  export type SetlistSongUncheckedUpdateManyWithoutSongNestedInput = {
    create?: XOR<SetlistSongCreateWithoutSongInput, SetlistSongUncheckedCreateWithoutSongInput> | SetlistSongCreateWithoutSongInput[] | SetlistSongUncheckedCreateWithoutSongInput[]
    connectOrCreate?: SetlistSongCreateOrConnectWithoutSongInput | SetlistSongCreateOrConnectWithoutSongInput[]
    upsert?: SetlistSongUpsertWithWhereUniqueWithoutSongInput | SetlistSongUpsertWithWhereUniqueWithoutSongInput[]
    createMany?: SetlistSongCreateManySongInputEnvelope
    set?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    disconnect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    delete?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    connect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    update?: SetlistSongUpdateWithWhereUniqueWithoutSongInput | SetlistSongUpdateWithWhereUniqueWithoutSongInput[]
    updateMany?: SetlistSongUpdateManyWithWhereWithoutSongInput | SetlistSongUpdateManyWithWhereWithoutSongInput[]
    deleteMany?: SetlistSongScalarWhereInput | SetlistSongScalarWhereInput[]
  }

  export type ShowCreateNestedOneWithoutSetlistsInput = {
    create?: XOR<ShowCreateWithoutSetlistsInput, ShowUncheckedCreateWithoutSetlistsInput>
    connectOrCreate?: ShowCreateOrConnectWithoutSetlistsInput
    connect?: ShowWhereUniqueInput
  }

  export type SetlistSongCreateNestedManyWithoutSetlistInput = {
    create?: XOR<SetlistSongCreateWithoutSetlistInput, SetlistSongUncheckedCreateWithoutSetlistInput> | SetlistSongCreateWithoutSetlistInput[] | SetlistSongUncheckedCreateWithoutSetlistInput[]
    connectOrCreate?: SetlistSongCreateOrConnectWithoutSetlistInput | SetlistSongCreateOrConnectWithoutSetlistInput[]
    createMany?: SetlistSongCreateManySetlistInputEnvelope
    connect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
  }

  export type SetlistSongUncheckedCreateNestedManyWithoutSetlistInput = {
    create?: XOR<SetlistSongCreateWithoutSetlistInput, SetlistSongUncheckedCreateWithoutSetlistInput> | SetlistSongCreateWithoutSetlistInput[] | SetlistSongUncheckedCreateWithoutSetlistInput[]
    connectOrCreate?: SetlistSongCreateOrConnectWithoutSetlistInput | SetlistSongCreateOrConnectWithoutSetlistInput[]
    createMany?: SetlistSongCreateManySetlistInputEnvelope
    connect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type ShowUpdateOneRequiredWithoutSetlistsNestedInput = {
    create?: XOR<ShowCreateWithoutSetlistsInput, ShowUncheckedCreateWithoutSetlistsInput>
    connectOrCreate?: ShowCreateOrConnectWithoutSetlistsInput
    upsert?: ShowUpsertWithoutSetlistsInput
    connect?: ShowWhereUniqueInput
    update?: XOR<XOR<ShowUpdateToOneWithWhereWithoutSetlistsInput, ShowUpdateWithoutSetlistsInput>, ShowUncheckedUpdateWithoutSetlistsInput>
  }

  export type SetlistSongUpdateManyWithoutSetlistNestedInput = {
    create?: XOR<SetlistSongCreateWithoutSetlistInput, SetlistSongUncheckedCreateWithoutSetlistInput> | SetlistSongCreateWithoutSetlistInput[] | SetlistSongUncheckedCreateWithoutSetlistInput[]
    connectOrCreate?: SetlistSongCreateOrConnectWithoutSetlistInput | SetlistSongCreateOrConnectWithoutSetlistInput[]
    upsert?: SetlistSongUpsertWithWhereUniqueWithoutSetlistInput | SetlistSongUpsertWithWhereUniqueWithoutSetlistInput[]
    createMany?: SetlistSongCreateManySetlistInputEnvelope
    set?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    disconnect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    delete?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    connect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    update?: SetlistSongUpdateWithWhereUniqueWithoutSetlistInput | SetlistSongUpdateWithWhereUniqueWithoutSetlistInput[]
    updateMany?: SetlistSongUpdateManyWithWhereWithoutSetlistInput | SetlistSongUpdateManyWithWhereWithoutSetlistInput[]
    deleteMany?: SetlistSongScalarWhereInput | SetlistSongScalarWhereInput[]
  }

  export type SetlistSongUncheckedUpdateManyWithoutSetlistNestedInput = {
    create?: XOR<SetlistSongCreateWithoutSetlistInput, SetlistSongUncheckedCreateWithoutSetlistInput> | SetlistSongCreateWithoutSetlistInput[] | SetlistSongUncheckedCreateWithoutSetlistInput[]
    connectOrCreate?: SetlistSongCreateOrConnectWithoutSetlistInput | SetlistSongCreateOrConnectWithoutSetlistInput[]
    upsert?: SetlistSongUpsertWithWhereUniqueWithoutSetlistInput | SetlistSongUpsertWithWhereUniqueWithoutSetlistInput[]
    createMany?: SetlistSongCreateManySetlistInputEnvelope
    set?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    disconnect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    delete?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    connect?: SetlistSongWhereUniqueInput | SetlistSongWhereUniqueInput[]
    update?: SetlistSongUpdateWithWhereUniqueWithoutSetlistInput | SetlistSongUpdateWithWhereUniqueWithoutSetlistInput[]
    updateMany?: SetlistSongUpdateManyWithWhereWithoutSetlistInput | SetlistSongUpdateManyWithWhereWithoutSetlistInput[]
    deleteMany?: SetlistSongScalarWhereInput | SetlistSongScalarWhereInput[]
  }

  export type SetlistCreateNestedOneWithoutSetlistSongsInput = {
    create?: XOR<SetlistCreateWithoutSetlistSongsInput, SetlistUncheckedCreateWithoutSetlistSongsInput>
    connectOrCreate?: SetlistCreateOrConnectWithoutSetlistSongsInput
    connect?: SetlistWhereUniqueInput
  }

  export type SongCreateNestedOneWithoutSetlistSongsInput = {
    create?: XOR<SongCreateWithoutSetlistSongsInput, SongUncheckedCreateWithoutSetlistSongsInput>
    connectOrCreate?: SongCreateOrConnectWithoutSetlistSongsInput
    connect?: SongWhereUniqueInput
  }

  export type VoteCreateNestedManyWithoutSetlistSongInput = {
    create?: XOR<VoteCreateWithoutSetlistSongInput, VoteUncheckedCreateWithoutSetlistSongInput> | VoteCreateWithoutSetlistSongInput[] | VoteUncheckedCreateWithoutSetlistSongInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutSetlistSongInput | VoteCreateOrConnectWithoutSetlistSongInput[]
    createMany?: VoteCreateManySetlistSongInputEnvelope
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
  }

  export type VoteUncheckedCreateNestedManyWithoutSetlistSongInput = {
    create?: XOR<VoteCreateWithoutSetlistSongInput, VoteUncheckedCreateWithoutSetlistSongInput> | VoteCreateWithoutSetlistSongInput[] | VoteUncheckedCreateWithoutSetlistSongInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutSetlistSongInput | VoteCreateOrConnectWithoutSetlistSongInput[]
    createMany?: VoteCreateManySetlistSongInputEnvelope
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
  }

  export type SetlistUpdateOneRequiredWithoutSetlistSongsNestedInput = {
    create?: XOR<SetlistCreateWithoutSetlistSongsInput, SetlistUncheckedCreateWithoutSetlistSongsInput>
    connectOrCreate?: SetlistCreateOrConnectWithoutSetlistSongsInput
    upsert?: SetlistUpsertWithoutSetlistSongsInput
    connect?: SetlistWhereUniqueInput
    update?: XOR<XOR<SetlistUpdateToOneWithWhereWithoutSetlistSongsInput, SetlistUpdateWithoutSetlistSongsInput>, SetlistUncheckedUpdateWithoutSetlistSongsInput>
  }

  export type SongUpdateOneRequiredWithoutSetlistSongsNestedInput = {
    create?: XOR<SongCreateWithoutSetlistSongsInput, SongUncheckedCreateWithoutSetlistSongsInput>
    connectOrCreate?: SongCreateOrConnectWithoutSetlistSongsInput
    upsert?: SongUpsertWithoutSetlistSongsInput
    connect?: SongWhereUniqueInput
    update?: XOR<XOR<SongUpdateToOneWithWhereWithoutSetlistSongsInput, SongUpdateWithoutSetlistSongsInput>, SongUncheckedUpdateWithoutSetlistSongsInput>
  }

  export type VoteUpdateManyWithoutSetlistSongNestedInput = {
    create?: XOR<VoteCreateWithoutSetlistSongInput, VoteUncheckedCreateWithoutSetlistSongInput> | VoteCreateWithoutSetlistSongInput[] | VoteUncheckedCreateWithoutSetlistSongInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutSetlistSongInput | VoteCreateOrConnectWithoutSetlistSongInput[]
    upsert?: VoteUpsertWithWhereUniqueWithoutSetlistSongInput | VoteUpsertWithWhereUniqueWithoutSetlistSongInput[]
    createMany?: VoteCreateManySetlistSongInputEnvelope
    set?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    disconnect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    delete?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    update?: VoteUpdateWithWhereUniqueWithoutSetlistSongInput | VoteUpdateWithWhereUniqueWithoutSetlistSongInput[]
    updateMany?: VoteUpdateManyWithWhereWithoutSetlistSongInput | VoteUpdateManyWithWhereWithoutSetlistSongInput[]
    deleteMany?: VoteScalarWhereInput | VoteScalarWhereInput[]
  }

  export type VoteUncheckedUpdateManyWithoutSetlistSongNestedInput = {
    create?: XOR<VoteCreateWithoutSetlistSongInput, VoteUncheckedCreateWithoutSetlistSongInput> | VoteCreateWithoutSetlistSongInput[] | VoteUncheckedCreateWithoutSetlistSongInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutSetlistSongInput | VoteCreateOrConnectWithoutSetlistSongInput[]
    upsert?: VoteUpsertWithWhereUniqueWithoutSetlistSongInput | VoteUpsertWithWhereUniqueWithoutSetlistSongInput[]
    createMany?: VoteCreateManySetlistSongInputEnvelope
    set?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    disconnect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    delete?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    update?: VoteUpdateWithWhereUniqueWithoutSetlistSongInput | VoteUpdateWithWhereUniqueWithoutSetlistSongInput[]
    updateMany?: VoteUpdateManyWithWhereWithoutSetlistSongInput | VoteUpdateManyWithWhereWithoutSetlistSongInput[]
    deleteMany?: VoteScalarWhereInput | VoteScalarWhereInput[]
  }

  export type VoteCreateNestedManyWithoutUserInput = {
    create?: XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput> | VoteCreateWithoutUserInput[] | VoteUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutUserInput | VoteCreateOrConnectWithoutUserInput[]
    createMany?: VoteCreateManyUserInputEnvelope
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
  }

  export type VoteAnalyticsCreateNestedManyWithoutUserInput = {
    create?: XOR<VoteAnalyticsCreateWithoutUserInput, VoteAnalyticsUncheckedCreateWithoutUserInput> | VoteAnalyticsCreateWithoutUserInput[] | VoteAnalyticsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VoteAnalyticsCreateOrConnectWithoutUserInput | VoteAnalyticsCreateOrConnectWithoutUserInput[]
    createMany?: VoteAnalyticsCreateManyUserInputEnvelope
    connect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
  }

  export type VoteUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput> | VoteCreateWithoutUserInput[] | VoteUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutUserInput | VoteCreateOrConnectWithoutUserInput[]
    createMany?: VoteCreateManyUserInputEnvelope
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
  }

  export type VoteAnalyticsUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<VoteAnalyticsCreateWithoutUserInput, VoteAnalyticsUncheckedCreateWithoutUserInput> | VoteAnalyticsCreateWithoutUserInput[] | VoteAnalyticsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VoteAnalyticsCreateOrConnectWithoutUserInput | VoteAnalyticsCreateOrConnectWithoutUserInput[]
    createMany?: VoteAnalyticsCreateManyUserInputEnvelope
    connect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
  }

  export type VoteUpdateManyWithoutUserNestedInput = {
    create?: XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput> | VoteCreateWithoutUserInput[] | VoteUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutUserInput | VoteCreateOrConnectWithoutUserInput[]
    upsert?: VoteUpsertWithWhereUniqueWithoutUserInput | VoteUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: VoteCreateManyUserInputEnvelope
    set?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    disconnect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    delete?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    update?: VoteUpdateWithWhereUniqueWithoutUserInput | VoteUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: VoteUpdateManyWithWhereWithoutUserInput | VoteUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: VoteScalarWhereInput | VoteScalarWhereInput[]
  }

  export type VoteAnalyticsUpdateManyWithoutUserNestedInput = {
    create?: XOR<VoteAnalyticsCreateWithoutUserInput, VoteAnalyticsUncheckedCreateWithoutUserInput> | VoteAnalyticsCreateWithoutUserInput[] | VoteAnalyticsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VoteAnalyticsCreateOrConnectWithoutUserInput | VoteAnalyticsCreateOrConnectWithoutUserInput[]
    upsert?: VoteAnalyticsUpsertWithWhereUniqueWithoutUserInput | VoteAnalyticsUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: VoteAnalyticsCreateManyUserInputEnvelope
    set?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    disconnect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    delete?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    connect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    update?: VoteAnalyticsUpdateWithWhereUniqueWithoutUserInput | VoteAnalyticsUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: VoteAnalyticsUpdateManyWithWhereWithoutUserInput | VoteAnalyticsUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: VoteAnalyticsScalarWhereInput | VoteAnalyticsScalarWhereInput[]
  }

  export type VoteUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput> | VoteCreateWithoutUserInput[] | VoteUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VoteCreateOrConnectWithoutUserInput | VoteCreateOrConnectWithoutUserInput[]
    upsert?: VoteUpsertWithWhereUniqueWithoutUserInput | VoteUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: VoteCreateManyUserInputEnvelope
    set?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    disconnect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    delete?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    update?: VoteUpdateWithWhereUniqueWithoutUserInput | VoteUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: VoteUpdateManyWithWhereWithoutUserInput | VoteUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: VoteScalarWhereInput | VoteScalarWhereInput[]
  }

  export type VoteAnalyticsUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<VoteAnalyticsCreateWithoutUserInput, VoteAnalyticsUncheckedCreateWithoutUserInput> | VoteAnalyticsCreateWithoutUserInput[] | VoteAnalyticsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: VoteAnalyticsCreateOrConnectWithoutUserInput | VoteAnalyticsCreateOrConnectWithoutUserInput[]
    upsert?: VoteAnalyticsUpsertWithWhereUniqueWithoutUserInput | VoteAnalyticsUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: VoteAnalyticsCreateManyUserInputEnvelope
    set?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    disconnect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    delete?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    connect?: VoteAnalyticsWhereUniqueInput | VoteAnalyticsWhereUniqueInput[]
    update?: VoteAnalyticsUpdateWithWhereUniqueWithoutUserInput | VoteAnalyticsUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: VoteAnalyticsUpdateManyWithWhereWithoutUserInput | VoteAnalyticsUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: VoteAnalyticsScalarWhereInput | VoteAnalyticsScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutVotesInput = {
    create?: XOR<UserCreateWithoutVotesInput, UserUncheckedCreateWithoutVotesInput>
    connectOrCreate?: UserCreateOrConnectWithoutVotesInput
    connect?: UserWhereUniqueInput
  }

  export type SetlistSongCreateNestedOneWithoutVotesInput = {
    create?: XOR<SetlistSongCreateWithoutVotesInput, SetlistSongUncheckedCreateWithoutVotesInput>
    connectOrCreate?: SetlistSongCreateOrConnectWithoutVotesInput
    connect?: SetlistSongWhereUniqueInput
  }

  export type ShowCreateNestedOneWithoutVotesInput = {
    create?: XOR<ShowCreateWithoutVotesInput, ShowUncheckedCreateWithoutVotesInput>
    connectOrCreate?: ShowCreateOrConnectWithoutVotesInput
    connect?: ShowWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutVotesNestedInput = {
    create?: XOR<UserCreateWithoutVotesInput, UserUncheckedCreateWithoutVotesInput>
    connectOrCreate?: UserCreateOrConnectWithoutVotesInput
    upsert?: UserUpsertWithoutVotesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutVotesInput, UserUpdateWithoutVotesInput>, UserUncheckedUpdateWithoutVotesInput>
  }

  export type SetlistSongUpdateOneRequiredWithoutVotesNestedInput = {
    create?: XOR<SetlistSongCreateWithoutVotesInput, SetlistSongUncheckedCreateWithoutVotesInput>
    connectOrCreate?: SetlistSongCreateOrConnectWithoutVotesInput
    upsert?: SetlistSongUpsertWithoutVotesInput
    connect?: SetlistSongWhereUniqueInput
    update?: XOR<XOR<SetlistSongUpdateToOneWithWhereWithoutVotesInput, SetlistSongUpdateWithoutVotesInput>, SetlistSongUncheckedUpdateWithoutVotesInput>
  }

  export type ShowUpdateOneRequiredWithoutVotesNestedInput = {
    create?: XOR<ShowCreateWithoutVotesInput, ShowUncheckedCreateWithoutVotesInput>
    connectOrCreate?: ShowCreateOrConnectWithoutVotesInput
    upsert?: ShowUpsertWithoutVotesInput
    connect?: ShowWhereUniqueInput
    update?: XOR<XOR<ShowUpdateToOneWithWhereWithoutVotesInput, ShowUpdateWithoutVotesInput>, ShowUncheckedUpdateWithoutVotesInput>
  }

  export type UserCreateNestedOneWithoutVoteAnalyticsInput = {
    create?: XOR<UserCreateWithoutVoteAnalyticsInput, UserUncheckedCreateWithoutVoteAnalyticsInput>
    connectOrCreate?: UserCreateOrConnectWithoutVoteAnalyticsInput
    connect?: UserWhereUniqueInput
  }

  export type ShowCreateNestedOneWithoutVoteAnalyticsInput = {
    create?: XOR<ShowCreateWithoutVoteAnalyticsInput, ShowUncheckedCreateWithoutVoteAnalyticsInput>
    connectOrCreate?: ShowCreateOrConnectWithoutVoteAnalyticsInput
    connect?: ShowWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutVoteAnalyticsNestedInput = {
    create?: XOR<UserCreateWithoutVoteAnalyticsInput, UserUncheckedCreateWithoutVoteAnalyticsInput>
    connectOrCreate?: UserCreateOrConnectWithoutVoteAnalyticsInput
    upsert?: UserUpsertWithoutVoteAnalyticsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutVoteAnalyticsInput, UserUpdateWithoutVoteAnalyticsInput>, UserUncheckedUpdateWithoutVoteAnalyticsInput>
  }

  export type ShowUpdateOneRequiredWithoutVoteAnalyticsNestedInput = {
    create?: XOR<ShowCreateWithoutVoteAnalyticsInput, ShowUncheckedCreateWithoutVoteAnalyticsInput>
    connectOrCreate?: ShowCreateOrConnectWithoutVoteAnalyticsInput
    upsert?: ShowUpsertWithoutVoteAnalyticsInput
    connect?: ShowWhereUniqueInput
    update?: XOR<XOR<ShowUpdateToOneWithWhereWithoutVoteAnalyticsInput, ShowUpdateWithoutVoteAnalyticsInput>, ShowUncheckedUpdateWithoutVoteAnalyticsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ShowCreateWithoutArtistInput = {
    id?: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    venue: VenueCreateNestedOneWithoutShowsInput
    setlists?: SetlistCreateNestedManyWithoutShowInput
    votes?: VoteCreateNestedManyWithoutShowInput
    voteAnalytics?: VoteAnalyticsCreateNestedManyWithoutShowInput
  }

  export type ShowUncheckedCreateWithoutArtistInput = {
    id?: string
    venueId: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    setlists?: SetlistUncheckedCreateNestedManyWithoutShowInput
    votes?: VoteUncheckedCreateNestedManyWithoutShowInput
    voteAnalytics?: VoteAnalyticsUncheckedCreateNestedManyWithoutShowInput
  }

  export type ShowCreateOrConnectWithoutArtistInput = {
    where: ShowWhereUniqueInput
    create: XOR<ShowCreateWithoutArtistInput, ShowUncheckedCreateWithoutArtistInput>
  }

  export type ShowCreateManyArtistInputEnvelope = {
    data: ShowCreateManyArtistInput | ShowCreateManyArtistInput[]
    skipDuplicates?: boolean
  }

  export type SongCreateWithoutArtistInput = {
    id?: string
    spotifyId?: string | null
    musicbrainzId?: string | null
    title: string
    album?: string | null
    albumImageUrl?: string | null
    durationMs?: number | null
    popularity?: number
    previewUrl?: string | null
    spotifyUrl?: string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    setlistSongs?: SetlistSongCreateNestedManyWithoutSongInput
  }

  export type SongUncheckedCreateWithoutArtistInput = {
    id?: string
    spotifyId?: string | null
    musicbrainzId?: string | null
    title: string
    album?: string | null
    albumImageUrl?: string | null
    durationMs?: number | null
    popularity?: number
    previewUrl?: string | null
    spotifyUrl?: string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    setlistSongs?: SetlistSongUncheckedCreateNestedManyWithoutSongInput
  }

  export type SongCreateOrConnectWithoutArtistInput = {
    where: SongWhereUniqueInput
    create: XOR<SongCreateWithoutArtistInput, SongUncheckedCreateWithoutArtistInput>
  }

  export type SongCreateManyArtistInputEnvelope = {
    data: SongCreateManyArtistInput | SongCreateManyArtistInput[]
    skipDuplicates?: boolean
  }

  export type ShowUpsertWithWhereUniqueWithoutArtistInput = {
    where: ShowWhereUniqueInput
    update: XOR<ShowUpdateWithoutArtistInput, ShowUncheckedUpdateWithoutArtistInput>
    create: XOR<ShowCreateWithoutArtistInput, ShowUncheckedCreateWithoutArtistInput>
  }

  export type ShowUpdateWithWhereUniqueWithoutArtistInput = {
    where: ShowWhereUniqueInput
    data: XOR<ShowUpdateWithoutArtistInput, ShowUncheckedUpdateWithoutArtistInput>
  }

  export type ShowUpdateManyWithWhereWithoutArtistInput = {
    where: ShowScalarWhereInput
    data: XOR<ShowUpdateManyMutationInput, ShowUncheckedUpdateManyWithoutArtistInput>
  }

  export type ShowScalarWhereInput = {
    AND?: ShowScalarWhereInput | ShowScalarWhereInput[]
    OR?: ShowScalarWhereInput[]
    NOT?: ShowScalarWhereInput | ShowScalarWhereInput[]
    id?: StringFilter<"Show"> | string
    artistId?: StringFilter<"Show"> | string
    venueId?: StringFilter<"Show"> | string
    ticketmasterId?: StringNullableFilter<"Show"> | string | null
    setlistfmId?: StringNullableFilter<"Show"> | string | null
    date?: DateTimeFilter<"Show"> | Date | string
    startTime?: DateTimeNullableFilter<"Show"> | Date | string | null
    doorsTime?: DateTimeNullableFilter<"Show"> | Date | string | null
    title?: StringNullableFilter<"Show"> | string | null
    tourName?: StringNullableFilter<"Show"> | string | null
    status?: StringFilter<"Show"> | string
    ticketmasterUrl?: StringNullableFilter<"Show"> | string | null
    viewCount?: IntFilter<"Show"> | number
    createdAt?: DateTimeFilter<"Show"> | Date | string
    updatedAt?: DateTimeFilter<"Show"> | Date | string
  }

  export type SongUpsertWithWhereUniqueWithoutArtistInput = {
    where: SongWhereUniqueInput
    update: XOR<SongUpdateWithoutArtistInput, SongUncheckedUpdateWithoutArtistInput>
    create: XOR<SongCreateWithoutArtistInput, SongUncheckedCreateWithoutArtistInput>
  }

  export type SongUpdateWithWhereUniqueWithoutArtistInput = {
    where: SongWhereUniqueInput
    data: XOR<SongUpdateWithoutArtistInput, SongUncheckedUpdateWithoutArtistInput>
  }

  export type SongUpdateManyWithWhereWithoutArtistInput = {
    where: SongScalarWhereInput
    data: XOR<SongUpdateManyMutationInput, SongUncheckedUpdateManyWithoutArtistInput>
  }

  export type SongScalarWhereInput = {
    AND?: SongScalarWhereInput | SongScalarWhereInput[]
    OR?: SongScalarWhereInput[]
    NOT?: SongScalarWhereInput | SongScalarWhereInput[]
    id?: StringFilter<"Song"> | string
    artistId?: StringFilter<"Song"> | string
    spotifyId?: StringNullableFilter<"Song"> | string | null
    musicbrainzId?: StringNullableFilter<"Song"> | string | null
    title?: StringFilter<"Song"> | string
    album?: StringNullableFilter<"Song"> | string | null
    albumImageUrl?: StringNullableFilter<"Song"> | string | null
    durationMs?: IntNullableFilter<"Song"> | number | null
    popularity?: IntFilter<"Song"> | number
    previewUrl?: StringNullableFilter<"Song"> | string | null
    spotifyUrl?: StringNullableFilter<"Song"> | string | null
    audioFeatures?: JsonNullableFilter<"Song">
    createdAt?: DateTimeFilter<"Song"> | Date | string
    updatedAt?: DateTimeFilter<"Song"> | Date | string
  }

  export type ShowCreateWithoutVenueInput = {
    id?: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    artist: ArtistCreateNestedOneWithoutShowsInput
    setlists?: SetlistCreateNestedManyWithoutShowInput
    votes?: VoteCreateNestedManyWithoutShowInput
    voteAnalytics?: VoteAnalyticsCreateNestedManyWithoutShowInput
  }

  export type ShowUncheckedCreateWithoutVenueInput = {
    id?: string
    artistId: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    setlists?: SetlistUncheckedCreateNestedManyWithoutShowInput
    votes?: VoteUncheckedCreateNestedManyWithoutShowInput
    voteAnalytics?: VoteAnalyticsUncheckedCreateNestedManyWithoutShowInput
  }

  export type ShowCreateOrConnectWithoutVenueInput = {
    where: ShowWhereUniqueInput
    create: XOR<ShowCreateWithoutVenueInput, ShowUncheckedCreateWithoutVenueInput>
  }

  export type ShowCreateManyVenueInputEnvelope = {
    data: ShowCreateManyVenueInput | ShowCreateManyVenueInput[]
    skipDuplicates?: boolean
  }

  export type ShowUpsertWithWhereUniqueWithoutVenueInput = {
    where: ShowWhereUniqueInput
    update: XOR<ShowUpdateWithoutVenueInput, ShowUncheckedUpdateWithoutVenueInput>
    create: XOR<ShowCreateWithoutVenueInput, ShowUncheckedCreateWithoutVenueInput>
  }

  export type ShowUpdateWithWhereUniqueWithoutVenueInput = {
    where: ShowWhereUniqueInput
    data: XOR<ShowUpdateWithoutVenueInput, ShowUncheckedUpdateWithoutVenueInput>
  }

  export type ShowUpdateManyWithWhereWithoutVenueInput = {
    where: ShowScalarWhereInput
    data: XOR<ShowUpdateManyMutationInput, ShowUncheckedUpdateManyWithoutVenueInput>
  }

  export type ArtistCreateWithoutShowsInput = {
    id?: string
    spotifyId?: string | null
    ticketmasterId?: string | null
    setlistfmMbid?: string | null
    name: string
    slug: string
    imageUrl?: string | null
    genres?: ArtistCreategenresInput | string[]
    popularity?: number
    followers?: number
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    songs?: SongCreateNestedManyWithoutArtistInput
  }

  export type ArtistUncheckedCreateWithoutShowsInput = {
    id?: string
    spotifyId?: string | null
    ticketmasterId?: string | null
    setlistfmMbid?: string | null
    name: string
    slug: string
    imageUrl?: string | null
    genres?: ArtistCreategenresInput | string[]
    popularity?: number
    followers?: number
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    songs?: SongUncheckedCreateNestedManyWithoutArtistInput
  }

  export type ArtistCreateOrConnectWithoutShowsInput = {
    where: ArtistWhereUniqueInput
    create: XOR<ArtistCreateWithoutShowsInput, ArtistUncheckedCreateWithoutShowsInput>
  }

  export type VenueCreateWithoutShowsInput = {
    id?: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    name: string
    address?: string | null
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    timezone?: string | null
    capacity?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VenueUncheckedCreateWithoutShowsInput = {
    id?: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    name: string
    address?: string | null
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    timezone?: string | null
    capacity?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VenueCreateOrConnectWithoutShowsInput = {
    where: VenueWhereUniqueInput
    create: XOR<VenueCreateWithoutShowsInput, VenueUncheckedCreateWithoutShowsInput>
  }

  export type SetlistCreateWithoutShowInput = {
    id?: string
    name?: string
    orderIndex?: number
    isEncore?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    setlistSongs?: SetlistSongCreateNestedManyWithoutSetlistInput
  }

  export type SetlistUncheckedCreateWithoutShowInput = {
    id?: string
    name?: string
    orderIndex?: number
    isEncore?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    setlistSongs?: SetlistSongUncheckedCreateNestedManyWithoutSetlistInput
  }

  export type SetlistCreateOrConnectWithoutShowInput = {
    where: SetlistWhereUniqueInput
    create: XOR<SetlistCreateWithoutShowInput, SetlistUncheckedCreateWithoutShowInput>
  }

  export type SetlistCreateManyShowInputEnvelope = {
    data: SetlistCreateManyShowInput | SetlistCreateManyShowInput[]
    skipDuplicates?: boolean
  }

  export type VoteCreateWithoutShowInput = {
    id?: string
    voteType?: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutVotesInput
    setlistSong: SetlistSongCreateNestedOneWithoutVotesInput
  }

  export type VoteUncheckedCreateWithoutShowInput = {
    id?: string
    userId: string
    setlistSongId: string
    voteType?: string
    createdAt?: Date | string
  }

  export type VoteCreateOrConnectWithoutShowInput = {
    where: VoteWhereUniqueInput
    create: XOR<VoteCreateWithoutShowInput, VoteUncheckedCreateWithoutShowInput>
  }

  export type VoteCreateManyShowInputEnvelope = {
    data: VoteCreateManyShowInput | VoteCreateManyShowInput[]
    skipDuplicates?: boolean
  }

  export type VoteAnalyticsCreateWithoutShowInput = {
    id?: string
    dailyVotes?: number
    showVotes?: number
    lastVoteAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutVoteAnalyticsInput
  }

  export type VoteAnalyticsUncheckedCreateWithoutShowInput = {
    id?: string
    userId: string
    dailyVotes?: number
    showVotes?: number
    lastVoteAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VoteAnalyticsCreateOrConnectWithoutShowInput = {
    where: VoteAnalyticsWhereUniqueInput
    create: XOR<VoteAnalyticsCreateWithoutShowInput, VoteAnalyticsUncheckedCreateWithoutShowInput>
  }

  export type VoteAnalyticsCreateManyShowInputEnvelope = {
    data: VoteAnalyticsCreateManyShowInput | VoteAnalyticsCreateManyShowInput[]
    skipDuplicates?: boolean
  }

  export type ArtistUpsertWithoutShowsInput = {
    update: XOR<ArtistUpdateWithoutShowsInput, ArtistUncheckedUpdateWithoutShowsInput>
    create: XOR<ArtistCreateWithoutShowsInput, ArtistUncheckedCreateWithoutShowsInput>
    where?: ArtistWhereInput
  }

  export type ArtistUpdateToOneWithWhereWithoutShowsInput = {
    where?: ArtistWhereInput
    data: XOR<ArtistUpdateWithoutShowsInput, ArtistUncheckedUpdateWithoutShowsInput>
  }

  export type ArtistUpdateWithoutShowsInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmMbid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    genres?: ArtistUpdategenresInput | string[]
    popularity?: IntFieldUpdateOperationsInput | number
    followers?: IntFieldUpdateOperationsInput | number
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    songs?: SongUpdateManyWithoutArtistNestedInput
  }

  export type ArtistUncheckedUpdateWithoutShowsInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmMbid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    genres?: ArtistUpdategenresInput | string[]
    popularity?: IntFieldUpdateOperationsInput | number
    followers?: IntFieldUpdateOperationsInput | number
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    songs?: SongUncheckedUpdateManyWithoutArtistNestedInput
  }

  export type VenueUpsertWithoutShowsInput = {
    update: XOR<VenueUpdateWithoutShowsInput, VenueUncheckedUpdateWithoutShowsInput>
    create: XOR<VenueCreateWithoutShowsInput, VenueUncheckedCreateWithoutShowsInput>
    where?: VenueWhereInput
  }

  export type VenueUpdateToOneWithWhereWithoutShowsInput = {
    where?: VenueWhereInput
    data: XOR<VenueUpdateWithoutShowsInput, VenueUncheckedUpdateWithoutShowsInput>
  }

  export type VenueUpdateWithoutShowsInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    timezone?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VenueUncheckedUpdateWithoutShowsInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    timezone?: NullableStringFieldUpdateOperationsInput | string | null
    capacity?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SetlistUpsertWithWhereUniqueWithoutShowInput = {
    where: SetlistWhereUniqueInput
    update: XOR<SetlistUpdateWithoutShowInput, SetlistUncheckedUpdateWithoutShowInput>
    create: XOR<SetlistCreateWithoutShowInput, SetlistUncheckedCreateWithoutShowInput>
  }

  export type SetlistUpdateWithWhereUniqueWithoutShowInput = {
    where: SetlistWhereUniqueInput
    data: XOR<SetlistUpdateWithoutShowInput, SetlistUncheckedUpdateWithoutShowInput>
  }

  export type SetlistUpdateManyWithWhereWithoutShowInput = {
    where: SetlistScalarWhereInput
    data: XOR<SetlistUpdateManyMutationInput, SetlistUncheckedUpdateManyWithoutShowInput>
  }

  export type SetlistScalarWhereInput = {
    AND?: SetlistScalarWhereInput | SetlistScalarWhereInput[]
    OR?: SetlistScalarWhereInput[]
    NOT?: SetlistScalarWhereInput | SetlistScalarWhereInput[]
    id?: StringFilter<"Setlist"> | string
    showId?: StringFilter<"Setlist"> | string
    name?: StringFilter<"Setlist"> | string
    orderIndex?: IntFilter<"Setlist"> | number
    isEncore?: BoolFilter<"Setlist"> | boolean
    createdAt?: DateTimeFilter<"Setlist"> | Date | string
    updatedAt?: DateTimeFilter<"Setlist"> | Date | string
  }

  export type VoteUpsertWithWhereUniqueWithoutShowInput = {
    where: VoteWhereUniqueInput
    update: XOR<VoteUpdateWithoutShowInput, VoteUncheckedUpdateWithoutShowInput>
    create: XOR<VoteCreateWithoutShowInput, VoteUncheckedCreateWithoutShowInput>
  }

  export type VoteUpdateWithWhereUniqueWithoutShowInput = {
    where: VoteWhereUniqueInput
    data: XOR<VoteUpdateWithoutShowInput, VoteUncheckedUpdateWithoutShowInput>
  }

  export type VoteUpdateManyWithWhereWithoutShowInput = {
    where: VoteScalarWhereInput
    data: XOR<VoteUpdateManyMutationInput, VoteUncheckedUpdateManyWithoutShowInput>
  }

  export type VoteScalarWhereInput = {
    AND?: VoteScalarWhereInput | VoteScalarWhereInput[]
    OR?: VoteScalarWhereInput[]
    NOT?: VoteScalarWhereInput | VoteScalarWhereInput[]
    id?: StringFilter<"Vote"> | string
    userId?: StringFilter<"Vote"> | string
    setlistSongId?: StringFilter<"Vote"> | string
    showId?: StringFilter<"Vote"> | string
    voteType?: StringFilter<"Vote"> | string
    createdAt?: DateTimeFilter<"Vote"> | Date | string
  }

  export type VoteAnalyticsUpsertWithWhereUniqueWithoutShowInput = {
    where: VoteAnalyticsWhereUniqueInput
    update: XOR<VoteAnalyticsUpdateWithoutShowInput, VoteAnalyticsUncheckedUpdateWithoutShowInput>
    create: XOR<VoteAnalyticsCreateWithoutShowInput, VoteAnalyticsUncheckedCreateWithoutShowInput>
  }

  export type VoteAnalyticsUpdateWithWhereUniqueWithoutShowInput = {
    where: VoteAnalyticsWhereUniqueInput
    data: XOR<VoteAnalyticsUpdateWithoutShowInput, VoteAnalyticsUncheckedUpdateWithoutShowInput>
  }

  export type VoteAnalyticsUpdateManyWithWhereWithoutShowInput = {
    where: VoteAnalyticsScalarWhereInput
    data: XOR<VoteAnalyticsUpdateManyMutationInput, VoteAnalyticsUncheckedUpdateManyWithoutShowInput>
  }

  export type VoteAnalyticsScalarWhereInput = {
    AND?: VoteAnalyticsScalarWhereInput | VoteAnalyticsScalarWhereInput[]
    OR?: VoteAnalyticsScalarWhereInput[]
    NOT?: VoteAnalyticsScalarWhereInput | VoteAnalyticsScalarWhereInput[]
    id?: StringFilter<"VoteAnalytics"> | string
    userId?: StringFilter<"VoteAnalytics"> | string
    showId?: StringFilter<"VoteAnalytics"> | string
    dailyVotes?: IntFilter<"VoteAnalytics"> | number
    showVotes?: IntFilter<"VoteAnalytics"> | number
    lastVoteAt?: DateTimeNullableFilter<"VoteAnalytics"> | Date | string | null
    createdAt?: DateTimeFilter<"VoteAnalytics"> | Date | string
    updatedAt?: DateTimeFilter<"VoteAnalytics"> | Date | string
  }

  export type ArtistCreateWithoutSongsInput = {
    id?: string
    spotifyId?: string | null
    ticketmasterId?: string | null
    setlistfmMbid?: string | null
    name: string
    slug: string
    imageUrl?: string | null
    genres?: ArtistCreategenresInput | string[]
    popularity?: number
    followers?: number
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    shows?: ShowCreateNestedManyWithoutArtistInput
  }

  export type ArtistUncheckedCreateWithoutSongsInput = {
    id?: string
    spotifyId?: string | null
    ticketmasterId?: string | null
    setlistfmMbid?: string | null
    name: string
    slug: string
    imageUrl?: string | null
    genres?: ArtistCreategenresInput | string[]
    popularity?: number
    followers?: number
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    shows?: ShowUncheckedCreateNestedManyWithoutArtistInput
  }

  export type ArtistCreateOrConnectWithoutSongsInput = {
    where: ArtistWhereUniqueInput
    create: XOR<ArtistCreateWithoutSongsInput, ArtistUncheckedCreateWithoutSongsInput>
  }

  export type SetlistSongCreateWithoutSongInput = {
    id?: string
    position: number
    voteCount?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    setlist: SetlistCreateNestedOneWithoutSetlistSongsInput
    votes?: VoteCreateNestedManyWithoutSetlistSongInput
  }

  export type SetlistSongUncheckedCreateWithoutSongInput = {
    id?: string
    setlistId: string
    position: number
    voteCount?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutSetlistSongInput
  }

  export type SetlistSongCreateOrConnectWithoutSongInput = {
    where: SetlistSongWhereUniqueInput
    create: XOR<SetlistSongCreateWithoutSongInput, SetlistSongUncheckedCreateWithoutSongInput>
  }

  export type SetlistSongCreateManySongInputEnvelope = {
    data: SetlistSongCreateManySongInput | SetlistSongCreateManySongInput[]
    skipDuplicates?: boolean
  }

  export type ArtistUpsertWithoutSongsInput = {
    update: XOR<ArtistUpdateWithoutSongsInput, ArtistUncheckedUpdateWithoutSongsInput>
    create: XOR<ArtistCreateWithoutSongsInput, ArtistUncheckedCreateWithoutSongsInput>
    where?: ArtistWhereInput
  }

  export type ArtistUpdateToOneWithWhereWithoutSongsInput = {
    where?: ArtistWhereInput
    data: XOR<ArtistUpdateWithoutSongsInput, ArtistUncheckedUpdateWithoutSongsInput>
  }

  export type ArtistUpdateWithoutSongsInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmMbid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    genres?: ArtistUpdategenresInput | string[]
    popularity?: IntFieldUpdateOperationsInput | number
    followers?: IntFieldUpdateOperationsInput | number
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shows?: ShowUpdateManyWithoutArtistNestedInput
  }

  export type ArtistUncheckedUpdateWithoutSongsInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmMbid?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    genres?: ArtistUpdategenresInput | string[]
    popularity?: IntFieldUpdateOperationsInput | number
    followers?: IntFieldUpdateOperationsInput | number
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shows?: ShowUncheckedUpdateManyWithoutArtistNestedInput
  }

  export type SetlistSongUpsertWithWhereUniqueWithoutSongInput = {
    where: SetlistSongWhereUniqueInput
    update: XOR<SetlistSongUpdateWithoutSongInput, SetlistSongUncheckedUpdateWithoutSongInput>
    create: XOR<SetlistSongCreateWithoutSongInput, SetlistSongUncheckedCreateWithoutSongInput>
  }

  export type SetlistSongUpdateWithWhereUniqueWithoutSongInput = {
    where: SetlistSongWhereUniqueInput
    data: XOR<SetlistSongUpdateWithoutSongInput, SetlistSongUncheckedUpdateWithoutSongInput>
  }

  export type SetlistSongUpdateManyWithWhereWithoutSongInput = {
    where: SetlistSongScalarWhereInput
    data: XOR<SetlistSongUpdateManyMutationInput, SetlistSongUncheckedUpdateManyWithoutSongInput>
  }

  export type SetlistSongScalarWhereInput = {
    AND?: SetlistSongScalarWhereInput | SetlistSongScalarWhereInput[]
    OR?: SetlistSongScalarWhereInput[]
    NOT?: SetlistSongScalarWhereInput | SetlistSongScalarWhereInput[]
    id?: StringFilter<"SetlistSong"> | string
    setlistId?: StringFilter<"SetlistSong"> | string
    songId?: StringFilter<"SetlistSong"> | string
    position?: IntFilter<"SetlistSong"> | number
    voteCount?: IntFilter<"SetlistSong"> | number
    notes?: StringNullableFilter<"SetlistSong"> | string | null
    createdAt?: DateTimeFilter<"SetlistSong"> | Date | string
    updatedAt?: DateTimeFilter<"SetlistSong"> | Date | string
  }

  export type ShowCreateWithoutSetlistsInput = {
    id?: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    artist: ArtistCreateNestedOneWithoutShowsInput
    venue: VenueCreateNestedOneWithoutShowsInput
    votes?: VoteCreateNestedManyWithoutShowInput
    voteAnalytics?: VoteAnalyticsCreateNestedManyWithoutShowInput
  }

  export type ShowUncheckedCreateWithoutSetlistsInput = {
    id?: string
    artistId: string
    venueId: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutShowInput
    voteAnalytics?: VoteAnalyticsUncheckedCreateNestedManyWithoutShowInput
  }

  export type ShowCreateOrConnectWithoutSetlistsInput = {
    where: ShowWhereUniqueInput
    create: XOR<ShowCreateWithoutSetlistsInput, ShowUncheckedCreateWithoutSetlistsInput>
  }

  export type SetlistSongCreateWithoutSetlistInput = {
    id?: string
    position: number
    voteCount?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    song: SongCreateNestedOneWithoutSetlistSongsInput
    votes?: VoteCreateNestedManyWithoutSetlistSongInput
  }

  export type SetlistSongUncheckedCreateWithoutSetlistInput = {
    id?: string
    songId: string
    position: number
    voteCount?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutSetlistSongInput
  }

  export type SetlistSongCreateOrConnectWithoutSetlistInput = {
    where: SetlistSongWhereUniqueInput
    create: XOR<SetlistSongCreateWithoutSetlistInput, SetlistSongUncheckedCreateWithoutSetlistInput>
  }

  export type SetlistSongCreateManySetlistInputEnvelope = {
    data: SetlistSongCreateManySetlistInput | SetlistSongCreateManySetlistInput[]
    skipDuplicates?: boolean
  }

  export type ShowUpsertWithoutSetlistsInput = {
    update: XOR<ShowUpdateWithoutSetlistsInput, ShowUncheckedUpdateWithoutSetlistsInput>
    create: XOR<ShowCreateWithoutSetlistsInput, ShowUncheckedCreateWithoutSetlistsInput>
    where?: ShowWhereInput
  }

  export type ShowUpdateToOneWithWhereWithoutSetlistsInput = {
    where?: ShowWhereInput
    data: XOR<ShowUpdateWithoutSetlistsInput, ShowUncheckedUpdateWithoutSetlistsInput>
  }

  export type ShowUpdateWithoutSetlistsInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artist?: ArtistUpdateOneRequiredWithoutShowsNestedInput
    venue?: VenueUpdateOneRequiredWithoutShowsNestedInput
    votes?: VoteUpdateManyWithoutShowNestedInput
    voteAnalytics?: VoteAnalyticsUpdateManyWithoutShowNestedInput
  }

  export type ShowUncheckedUpdateWithoutSetlistsInput = {
    id?: StringFieldUpdateOperationsInput | string
    artistId?: StringFieldUpdateOperationsInput | string
    venueId?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutShowNestedInput
    voteAnalytics?: VoteAnalyticsUncheckedUpdateManyWithoutShowNestedInput
  }

  export type SetlistSongUpsertWithWhereUniqueWithoutSetlistInput = {
    where: SetlistSongWhereUniqueInput
    update: XOR<SetlistSongUpdateWithoutSetlistInput, SetlistSongUncheckedUpdateWithoutSetlistInput>
    create: XOR<SetlistSongCreateWithoutSetlistInput, SetlistSongUncheckedCreateWithoutSetlistInput>
  }

  export type SetlistSongUpdateWithWhereUniqueWithoutSetlistInput = {
    where: SetlistSongWhereUniqueInput
    data: XOR<SetlistSongUpdateWithoutSetlistInput, SetlistSongUncheckedUpdateWithoutSetlistInput>
  }

  export type SetlistSongUpdateManyWithWhereWithoutSetlistInput = {
    where: SetlistSongScalarWhereInput
    data: XOR<SetlistSongUpdateManyMutationInput, SetlistSongUncheckedUpdateManyWithoutSetlistInput>
  }

  export type SetlistCreateWithoutSetlistSongsInput = {
    id?: string
    name?: string
    orderIndex?: number
    isEncore?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    show: ShowCreateNestedOneWithoutSetlistsInput
  }

  export type SetlistUncheckedCreateWithoutSetlistSongsInput = {
    id?: string
    showId: string
    name?: string
    orderIndex?: number
    isEncore?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SetlistCreateOrConnectWithoutSetlistSongsInput = {
    where: SetlistWhereUniqueInput
    create: XOR<SetlistCreateWithoutSetlistSongsInput, SetlistUncheckedCreateWithoutSetlistSongsInput>
  }

  export type SongCreateWithoutSetlistSongsInput = {
    id?: string
    spotifyId?: string | null
    musicbrainzId?: string | null
    title: string
    album?: string | null
    albumImageUrl?: string | null
    durationMs?: number | null
    popularity?: number
    previewUrl?: string | null
    spotifyUrl?: string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    artist: ArtistCreateNestedOneWithoutSongsInput
  }

  export type SongUncheckedCreateWithoutSetlistSongsInput = {
    id?: string
    artistId: string
    spotifyId?: string | null
    musicbrainzId?: string | null
    title: string
    album?: string | null
    albumImageUrl?: string | null
    durationMs?: number | null
    popularity?: number
    previewUrl?: string | null
    spotifyUrl?: string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SongCreateOrConnectWithoutSetlistSongsInput = {
    where: SongWhereUniqueInput
    create: XOR<SongCreateWithoutSetlistSongsInput, SongUncheckedCreateWithoutSetlistSongsInput>
  }

  export type VoteCreateWithoutSetlistSongInput = {
    id?: string
    voteType?: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutVotesInput
    show: ShowCreateNestedOneWithoutVotesInput
  }

  export type VoteUncheckedCreateWithoutSetlistSongInput = {
    id?: string
    userId: string
    showId: string
    voteType?: string
    createdAt?: Date | string
  }

  export type VoteCreateOrConnectWithoutSetlistSongInput = {
    where: VoteWhereUniqueInput
    create: XOR<VoteCreateWithoutSetlistSongInput, VoteUncheckedCreateWithoutSetlistSongInput>
  }

  export type VoteCreateManySetlistSongInputEnvelope = {
    data: VoteCreateManySetlistSongInput | VoteCreateManySetlistSongInput[]
    skipDuplicates?: boolean
  }

  export type SetlistUpsertWithoutSetlistSongsInput = {
    update: XOR<SetlistUpdateWithoutSetlistSongsInput, SetlistUncheckedUpdateWithoutSetlistSongsInput>
    create: XOR<SetlistCreateWithoutSetlistSongsInput, SetlistUncheckedCreateWithoutSetlistSongsInput>
    where?: SetlistWhereInput
  }

  export type SetlistUpdateToOneWithWhereWithoutSetlistSongsInput = {
    where?: SetlistWhereInput
    data: XOR<SetlistUpdateWithoutSetlistSongsInput, SetlistUncheckedUpdateWithoutSetlistSongsInput>
  }

  export type SetlistUpdateWithoutSetlistSongsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    orderIndex?: IntFieldUpdateOperationsInput | number
    isEncore?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    show?: ShowUpdateOneRequiredWithoutSetlistsNestedInput
  }

  export type SetlistUncheckedUpdateWithoutSetlistSongsInput = {
    id?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    orderIndex?: IntFieldUpdateOperationsInput | number
    isEncore?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SongUpsertWithoutSetlistSongsInput = {
    update: XOR<SongUpdateWithoutSetlistSongsInput, SongUncheckedUpdateWithoutSetlistSongsInput>
    create: XOR<SongCreateWithoutSetlistSongsInput, SongUncheckedCreateWithoutSetlistSongsInput>
    where?: SongWhereInput
  }

  export type SongUpdateToOneWithWhereWithoutSetlistSongsInput = {
    where?: SongWhereInput
    data: XOR<SongUpdateWithoutSetlistSongsInput, SongUncheckedUpdateWithoutSetlistSongsInput>
  }

  export type SongUpdateWithoutSetlistSongsInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    musicbrainzId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    album?: NullableStringFieldUpdateOperationsInput | string | null
    albumImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    popularity?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyUrl?: NullableStringFieldUpdateOperationsInput | string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artist?: ArtistUpdateOneRequiredWithoutSongsNestedInput
  }

  export type SongUncheckedUpdateWithoutSetlistSongsInput = {
    id?: StringFieldUpdateOperationsInput | string
    artistId?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    musicbrainzId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    album?: NullableStringFieldUpdateOperationsInput | string | null
    albumImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    popularity?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyUrl?: NullableStringFieldUpdateOperationsInput | string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteUpsertWithWhereUniqueWithoutSetlistSongInput = {
    where: VoteWhereUniqueInput
    update: XOR<VoteUpdateWithoutSetlistSongInput, VoteUncheckedUpdateWithoutSetlistSongInput>
    create: XOR<VoteCreateWithoutSetlistSongInput, VoteUncheckedCreateWithoutSetlistSongInput>
  }

  export type VoteUpdateWithWhereUniqueWithoutSetlistSongInput = {
    where: VoteWhereUniqueInput
    data: XOR<VoteUpdateWithoutSetlistSongInput, VoteUncheckedUpdateWithoutSetlistSongInput>
  }

  export type VoteUpdateManyWithWhereWithoutSetlistSongInput = {
    where: VoteScalarWhereInput
    data: XOR<VoteUpdateManyMutationInput, VoteUncheckedUpdateManyWithoutSetlistSongInput>
  }

  export type VoteCreateWithoutUserInput = {
    id?: string
    voteType?: string
    createdAt?: Date | string
    setlistSong: SetlistSongCreateNestedOneWithoutVotesInput
    show: ShowCreateNestedOneWithoutVotesInput
  }

  export type VoteUncheckedCreateWithoutUserInput = {
    id?: string
    setlistSongId: string
    showId: string
    voteType?: string
    createdAt?: Date | string
  }

  export type VoteCreateOrConnectWithoutUserInput = {
    where: VoteWhereUniqueInput
    create: XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput>
  }

  export type VoteCreateManyUserInputEnvelope = {
    data: VoteCreateManyUserInput | VoteCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type VoteAnalyticsCreateWithoutUserInput = {
    id?: string
    dailyVotes?: number
    showVotes?: number
    lastVoteAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    show: ShowCreateNestedOneWithoutVoteAnalyticsInput
  }

  export type VoteAnalyticsUncheckedCreateWithoutUserInput = {
    id?: string
    showId: string
    dailyVotes?: number
    showVotes?: number
    lastVoteAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VoteAnalyticsCreateOrConnectWithoutUserInput = {
    where: VoteAnalyticsWhereUniqueInput
    create: XOR<VoteAnalyticsCreateWithoutUserInput, VoteAnalyticsUncheckedCreateWithoutUserInput>
  }

  export type VoteAnalyticsCreateManyUserInputEnvelope = {
    data: VoteAnalyticsCreateManyUserInput | VoteAnalyticsCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type VoteUpsertWithWhereUniqueWithoutUserInput = {
    where: VoteWhereUniqueInput
    update: XOR<VoteUpdateWithoutUserInput, VoteUncheckedUpdateWithoutUserInput>
    create: XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput>
  }

  export type VoteUpdateWithWhereUniqueWithoutUserInput = {
    where: VoteWhereUniqueInput
    data: XOR<VoteUpdateWithoutUserInput, VoteUncheckedUpdateWithoutUserInput>
  }

  export type VoteUpdateManyWithWhereWithoutUserInput = {
    where: VoteScalarWhereInput
    data: XOR<VoteUpdateManyMutationInput, VoteUncheckedUpdateManyWithoutUserInput>
  }

  export type VoteAnalyticsUpsertWithWhereUniqueWithoutUserInput = {
    where: VoteAnalyticsWhereUniqueInput
    update: XOR<VoteAnalyticsUpdateWithoutUserInput, VoteAnalyticsUncheckedUpdateWithoutUserInput>
    create: XOR<VoteAnalyticsCreateWithoutUserInput, VoteAnalyticsUncheckedCreateWithoutUserInput>
  }

  export type VoteAnalyticsUpdateWithWhereUniqueWithoutUserInput = {
    where: VoteAnalyticsWhereUniqueInput
    data: XOR<VoteAnalyticsUpdateWithoutUserInput, VoteAnalyticsUncheckedUpdateWithoutUserInput>
  }

  export type VoteAnalyticsUpdateManyWithWhereWithoutUserInput = {
    where: VoteAnalyticsScalarWhereInput
    data: XOR<VoteAnalyticsUpdateManyMutationInput, VoteAnalyticsUncheckedUpdateManyWithoutUserInput>
  }

  export type UserCreateWithoutVotesInput = {
    id?: string
    email?: string | null
    displayName?: string | null
    avatarUrl?: string | null
    spotifyId?: string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    voteAnalytics?: VoteAnalyticsCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutVotesInput = {
    id?: string
    email?: string | null
    displayName?: string | null
    avatarUrl?: string | null
    spotifyId?: string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    voteAnalytics?: VoteAnalyticsUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutVotesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutVotesInput, UserUncheckedCreateWithoutVotesInput>
  }

  export type SetlistSongCreateWithoutVotesInput = {
    id?: string
    position: number
    voteCount?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    setlist: SetlistCreateNestedOneWithoutSetlistSongsInput
    song: SongCreateNestedOneWithoutSetlistSongsInput
  }

  export type SetlistSongUncheckedCreateWithoutVotesInput = {
    id?: string
    setlistId: string
    songId: string
    position: number
    voteCount?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SetlistSongCreateOrConnectWithoutVotesInput = {
    where: SetlistSongWhereUniqueInput
    create: XOR<SetlistSongCreateWithoutVotesInput, SetlistSongUncheckedCreateWithoutVotesInput>
  }

  export type ShowCreateWithoutVotesInput = {
    id?: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    artist: ArtistCreateNestedOneWithoutShowsInput
    venue: VenueCreateNestedOneWithoutShowsInput
    setlists?: SetlistCreateNestedManyWithoutShowInput
    voteAnalytics?: VoteAnalyticsCreateNestedManyWithoutShowInput
  }

  export type ShowUncheckedCreateWithoutVotesInput = {
    id?: string
    artistId: string
    venueId: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    setlists?: SetlistUncheckedCreateNestedManyWithoutShowInput
    voteAnalytics?: VoteAnalyticsUncheckedCreateNestedManyWithoutShowInput
  }

  export type ShowCreateOrConnectWithoutVotesInput = {
    where: ShowWhereUniqueInput
    create: XOR<ShowCreateWithoutVotesInput, ShowUncheckedCreateWithoutVotesInput>
  }

  export type UserUpsertWithoutVotesInput = {
    update: XOR<UserUpdateWithoutVotesInput, UserUncheckedUpdateWithoutVotesInput>
    create: XOR<UserCreateWithoutVotesInput, UserUncheckedCreateWithoutVotesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutVotesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutVotesInput, UserUncheckedUpdateWithoutVotesInput>
  }

  export type UserUpdateWithoutVotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    voteAnalytics?: VoteAnalyticsUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutVotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    voteAnalytics?: VoteAnalyticsUncheckedUpdateManyWithoutUserNestedInput
  }

  export type SetlistSongUpsertWithoutVotesInput = {
    update: XOR<SetlistSongUpdateWithoutVotesInput, SetlistSongUncheckedUpdateWithoutVotesInput>
    create: XOR<SetlistSongCreateWithoutVotesInput, SetlistSongUncheckedCreateWithoutVotesInput>
    where?: SetlistSongWhereInput
  }

  export type SetlistSongUpdateToOneWithWhereWithoutVotesInput = {
    where?: SetlistSongWhereInput
    data: XOR<SetlistSongUpdateWithoutVotesInput, SetlistSongUncheckedUpdateWithoutVotesInput>
  }

  export type SetlistSongUpdateWithoutVotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlist?: SetlistUpdateOneRequiredWithoutSetlistSongsNestedInput
    song?: SongUpdateOneRequiredWithoutSetlistSongsNestedInput
  }

  export type SetlistSongUncheckedUpdateWithoutVotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    setlistId?: StringFieldUpdateOperationsInput | string
    songId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShowUpsertWithoutVotesInput = {
    update: XOR<ShowUpdateWithoutVotesInput, ShowUncheckedUpdateWithoutVotesInput>
    create: XOR<ShowCreateWithoutVotesInput, ShowUncheckedCreateWithoutVotesInput>
    where?: ShowWhereInput
  }

  export type ShowUpdateToOneWithWhereWithoutVotesInput = {
    where?: ShowWhereInput
    data: XOR<ShowUpdateWithoutVotesInput, ShowUncheckedUpdateWithoutVotesInput>
  }

  export type ShowUpdateWithoutVotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artist?: ArtistUpdateOneRequiredWithoutShowsNestedInput
    venue?: VenueUpdateOneRequiredWithoutShowsNestedInput
    setlists?: SetlistUpdateManyWithoutShowNestedInput
    voteAnalytics?: VoteAnalyticsUpdateManyWithoutShowNestedInput
  }

  export type ShowUncheckedUpdateWithoutVotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    artistId?: StringFieldUpdateOperationsInput | string
    venueId?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlists?: SetlistUncheckedUpdateManyWithoutShowNestedInput
    voteAnalytics?: VoteAnalyticsUncheckedUpdateManyWithoutShowNestedInput
  }

  export type UserCreateWithoutVoteAnalyticsInput = {
    id?: string
    email?: string | null
    displayName?: string | null
    avatarUrl?: string | null
    spotifyId?: string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    votes?: VoteCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutVoteAnalyticsInput = {
    id?: string
    email?: string | null
    displayName?: string | null
    avatarUrl?: string | null
    spotifyId?: string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutVoteAnalyticsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutVoteAnalyticsInput, UserUncheckedCreateWithoutVoteAnalyticsInput>
  }

  export type ShowCreateWithoutVoteAnalyticsInput = {
    id?: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    artist: ArtistCreateNestedOneWithoutShowsInput
    venue: VenueCreateNestedOneWithoutShowsInput
    setlists?: SetlistCreateNestedManyWithoutShowInput
    votes?: VoteCreateNestedManyWithoutShowInput
  }

  export type ShowUncheckedCreateWithoutVoteAnalyticsInput = {
    id?: string
    artistId: string
    venueId: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    setlists?: SetlistUncheckedCreateNestedManyWithoutShowInput
    votes?: VoteUncheckedCreateNestedManyWithoutShowInput
  }

  export type ShowCreateOrConnectWithoutVoteAnalyticsInput = {
    where: ShowWhereUniqueInput
    create: XOR<ShowCreateWithoutVoteAnalyticsInput, ShowUncheckedCreateWithoutVoteAnalyticsInput>
  }

  export type UserUpsertWithoutVoteAnalyticsInput = {
    update: XOR<UserUpdateWithoutVoteAnalyticsInput, UserUncheckedUpdateWithoutVoteAnalyticsInput>
    create: XOR<UserCreateWithoutVoteAnalyticsInput, UserUncheckedCreateWithoutVoteAnalyticsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutVoteAnalyticsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutVoteAnalyticsInput, UserUncheckedUpdateWithoutVoteAnalyticsInput>
  }

  export type UserUpdateWithoutVoteAnalyticsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutVoteAnalyticsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    preferences?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutUserNestedInput
  }

  export type ShowUpsertWithoutVoteAnalyticsInput = {
    update: XOR<ShowUpdateWithoutVoteAnalyticsInput, ShowUncheckedUpdateWithoutVoteAnalyticsInput>
    create: XOR<ShowCreateWithoutVoteAnalyticsInput, ShowUncheckedCreateWithoutVoteAnalyticsInput>
    where?: ShowWhereInput
  }

  export type ShowUpdateToOneWithWhereWithoutVoteAnalyticsInput = {
    where?: ShowWhereInput
    data: XOR<ShowUpdateWithoutVoteAnalyticsInput, ShowUncheckedUpdateWithoutVoteAnalyticsInput>
  }

  export type ShowUpdateWithoutVoteAnalyticsInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artist?: ArtistUpdateOneRequiredWithoutShowsNestedInput
    venue?: VenueUpdateOneRequiredWithoutShowsNestedInput
    setlists?: SetlistUpdateManyWithoutShowNestedInput
    votes?: VoteUpdateManyWithoutShowNestedInput
  }

  export type ShowUncheckedUpdateWithoutVoteAnalyticsInput = {
    id?: StringFieldUpdateOperationsInput | string
    artistId?: StringFieldUpdateOperationsInput | string
    venueId?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlists?: SetlistUncheckedUpdateManyWithoutShowNestedInput
    votes?: VoteUncheckedUpdateManyWithoutShowNestedInput
  }

  export type ShowCreateManyArtistInput = {
    id?: string
    venueId: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SongCreateManyArtistInput = {
    id?: string
    spotifyId?: string | null
    musicbrainzId?: string | null
    title: string
    album?: string | null
    albumImageUrl?: string | null
    durationMs?: number | null
    popularity?: number
    previewUrl?: string | null
    spotifyUrl?: string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ShowUpdateWithoutArtistInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    venue?: VenueUpdateOneRequiredWithoutShowsNestedInput
    setlists?: SetlistUpdateManyWithoutShowNestedInput
    votes?: VoteUpdateManyWithoutShowNestedInput
    voteAnalytics?: VoteAnalyticsUpdateManyWithoutShowNestedInput
  }

  export type ShowUncheckedUpdateWithoutArtistInput = {
    id?: StringFieldUpdateOperationsInput | string
    venueId?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlists?: SetlistUncheckedUpdateManyWithoutShowNestedInput
    votes?: VoteUncheckedUpdateManyWithoutShowNestedInput
    voteAnalytics?: VoteAnalyticsUncheckedUpdateManyWithoutShowNestedInput
  }

  export type ShowUncheckedUpdateManyWithoutArtistInput = {
    id?: StringFieldUpdateOperationsInput | string
    venueId?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SongUpdateWithoutArtistInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    musicbrainzId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    album?: NullableStringFieldUpdateOperationsInput | string | null
    albumImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    popularity?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyUrl?: NullableStringFieldUpdateOperationsInput | string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlistSongs?: SetlistSongUpdateManyWithoutSongNestedInput
  }

  export type SongUncheckedUpdateWithoutArtistInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    musicbrainzId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    album?: NullableStringFieldUpdateOperationsInput | string | null
    albumImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    popularity?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyUrl?: NullableStringFieldUpdateOperationsInput | string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlistSongs?: SetlistSongUncheckedUpdateManyWithoutSongNestedInput
  }

  export type SongUncheckedUpdateManyWithoutArtistInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotifyId?: NullableStringFieldUpdateOperationsInput | string | null
    musicbrainzId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    album?: NullableStringFieldUpdateOperationsInput | string | null
    albumImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    popularity?: IntFieldUpdateOperationsInput | number
    previewUrl?: NullableStringFieldUpdateOperationsInput | string | null
    spotifyUrl?: NullableStringFieldUpdateOperationsInput | string | null
    audioFeatures?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShowCreateManyVenueInput = {
    id?: string
    artistId: string
    ticketmasterId?: string | null
    setlistfmId?: string | null
    date: Date | string
    startTime?: Date | string | null
    doorsTime?: Date | string | null
    title?: string | null
    tourName?: string | null
    status?: string
    ticketmasterUrl?: string | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ShowUpdateWithoutVenueInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artist?: ArtistUpdateOneRequiredWithoutShowsNestedInput
    setlists?: SetlistUpdateManyWithoutShowNestedInput
    votes?: VoteUpdateManyWithoutShowNestedInput
    voteAnalytics?: VoteAnalyticsUpdateManyWithoutShowNestedInput
  }

  export type ShowUncheckedUpdateWithoutVenueInput = {
    id?: StringFieldUpdateOperationsInput | string
    artistId?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlists?: SetlistUncheckedUpdateManyWithoutShowNestedInput
    votes?: VoteUncheckedUpdateManyWithoutShowNestedInput
    voteAnalytics?: VoteAnalyticsUncheckedUpdateManyWithoutShowNestedInput
  }

  export type ShowUncheckedUpdateManyWithoutVenueInput = {
    id?: StringFieldUpdateOperationsInput | string
    artistId?: StringFieldUpdateOperationsInput | string
    ticketmasterId?: NullableStringFieldUpdateOperationsInput | string | null
    setlistfmId?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    startTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    doorsTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    tourName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    ticketmasterUrl?: NullableStringFieldUpdateOperationsInput | string | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SetlistCreateManyShowInput = {
    id?: string
    name?: string
    orderIndex?: number
    isEncore?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VoteCreateManyShowInput = {
    id?: string
    userId: string
    setlistSongId: string
    voteType?: string
    createdAt?: Date | string
  }

  export type VoteAnalyticsCreateManyShowInput = {
    id?: string
    userId: string
    dailyVotes?: number
    showVotes?: number
    lastVoteAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SetlistUpdateWithoutShowInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    orderIndex?: IntFieldUpdateOperationsInput | number
    isEncore?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlistSongs?: SetlistSongUpdateManyWithoutSetlistNestedInput
  }

  export type SetlistUncheckedUpdateWithoutShowInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    orderIndex?: IntFieldUpdateOperationsInput | number
    isEncore?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlistSongs?: SetlistSongUncheckedUpdateManyWithoutSetlistNestedInput
  }

  export type SetlistUncheckedUpdateManyWithoutShowInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    orderIndex?: IntFieldUpdateOperationsInput | number
    isEncore?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteUpdateWithoutShowInput = {
    id?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutVotesNestedInput
    setlistSong?: SetlistSongUpdateOneRequiredWithoutVotesNestedInput
  }

  export type VoteUncheckedUpdateWithoutShowInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    setlistSongId?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteUncheckedUpdateManyWithoutShowInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    setlistSongId?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteAnalyticsUpdateWithoutShowInput = {
    id?: StringFieldUpdateOperationsInput | string
    dailyVotes?: IntFieldUpdateOperationsInput | number
    showVotes?: IntFieldUpdateOperationsInput | number
    lastVoteAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutVoteAnalyticsNestedInput
  }

  export type VoteAnalyticsUncheckedUpdateWithoutShowInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    dailyVotes?: IntFieldUpdateOperationsInput | number
    showVotes?: IntFieldUpdateOperationsInput | number
    lastVoteAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteAnalyticsUncheckedUpdateManyWithoutShowInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    dailyVotes?: IntFieldUpdateOperationsInput | number
    showVotes?: IntFieldUpdateOperationsInput | number
    lastVoteAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SetlistSongCreateManySongInput = {
    id?: string
    setlistId: string
    position: number
    voteCount?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SetlistSongUpdateWithoutSongInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlist?: SetlistUpdateOneRequiredWithoutSetlistSongsNestedInput
    votes?: VoteUpdateManyWithoutSetlistSongNestedInput
  }

  export type SetlistSongUncheckedUpdateWithoutSongInput = {
    id?: StringFieldUpdateOperationsInput | string
    setlistId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutSetlistSongNestedInput
  }

  export type SetlistSongUncheckedUpdateManyWithoutSongInput = {
    id?: StringFieldUpdateOperationsInput | string
    setlistId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SetlistSongCreateManySetlistInput = {
    id?: string
    songId: string
    position: number
    voteCount?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SetlistSongUpdateWithoutSetlistInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    song?: SongUpdateOneRequiredWithoutSetlistSongsNestedInput
    votes?: VoteUpdateManyWithoutSetlistSongNestedInput
  }

  export type SetlistSongUncheckedUpdateWithoutSetlistInput = {
    id?: StringFieldUpdateOperationsInput | string
    songId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutSetlistSongNestedInput
  }

  export type SetlistSongUncheckedUpdateManyWithoutSetlistInput = {
    id?: StringFieldUpdateOperationsInput | string
    songId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    voteCount?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteCreateManySetlistSongInput = {
    id?: string
    userId: string
    showId: string
    voteType?: string
    createdAt?: Date | string
  }

  export type VoteUpdateWithoutSetlistSongInput = {
    id?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutVotesNestedInput
    show?: ShowUpdateOneRequiredWithoutVotesNestedInput
  }

  export type VoteUncheckedUpdateWithoutSetlistSongInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteUncheckedUpdateManyWithoutSetlistSongInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteCreateManyUserInput = {
    id?: string
    setlistSongId: string
    showId: string
    voteType?: string
    createdAt?: Date | string
  }

  export type VoteAnalyticsCreateManyUserInput = {
    id?: string
    showId: string
    dailyVotes?: number
    showVotes?: number
    lastVoteAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VoteUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    setlistSong?: SetlistSongUpdateOneRequiredWithoutVotesNestedInput
    show?: ShowUpdateOneRequiredWithoutVotesNestedInput
  }

  export type VoteUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    setlistSongId?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    setlistSongId?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    voteType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteAnalyticsUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    dailyVotes?: IntFieldUpdateOperationsInput | number
    showVotes?: IntFieldUpdateOperationsInput | number
    lastVoteAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    show?: ShowUpdateOneRequiredWithoutVoteAnalyticsNestedInput
  }

  export type VoteAnalyticsUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    dailyVotes?: IntFieldUpdateOperationsInput | number
    showVotes?: IntFieldUpdateOperationsInput | number
    lastVoteAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteAnalyticsUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    showId?: StringFieldUpdateOperationsInput | string
    dailyVotes?: IntFieldUpdateOperationsInput | number
    showVotes?: IntFieldUpdateOperationsInput | number
    lastVoteAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use ArtistCountOutputTypeDefaultArgs instead
     */
    export type ArtistCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ArtistCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use VenueCountOutputTypeDefaultArgs instead
     */
    export type VenueCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = VenueCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ShowCountOutputTypeDefaultArgs instead
     */
    export type ShowCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ShowCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SongCountOutputTypeDefaultArgs instead
     */
    export type SongCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SongCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SetlistCountOutputTypeDefaultArgs instead
     */
    export type SetlistCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SetlistCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SetlistSongCountOutputTypeDefaultArgs instead
     */
    export type SetlistSongCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SetlistSongCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserCountOutputTypeDefaultArgs instead
     */
    export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ArtistDefaultArgs instead
     */
    export type ArtistArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ArtistDefaultArgs<ExtArgs>
    /**
     * @deprecated Use VenueDefaultArgs instead
     */
    export type VenueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = VenueDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ShowDefaultArgs instead
     */
    export type ShowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ShowDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SongDefaultArgs instead
     */
    export type SongArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SongDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SetlistDefaultArgs instead
     */
    export type SetlistArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SetlistDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SetlistSongDefaultArgs instead
     */
    export type SetlistSongArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SetlistSongDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use VoteDefaultArgs instead
     */
    export type VoteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = VoteDefaultArgs<ExtArgs>
    /**
     * @deprecated Use VoteAnalyticsDefaultArgs instead
     */
    export type VoteAnalyticsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = VoteAnalyticsDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SyncHistoryDefaultArgs instead
     */
    export type SyncHistoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SyncHistoryDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}