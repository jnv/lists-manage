import got from 'got'

declare const ghGot: ghGot.GhGotInstance

declare namespace ghGot {
  type GhGotFn = {
    (url: got.GotUrl): got.GotPromise<object>
    (url: got.GotUrl, options: GhGotOptions): got.GotPromise<object>
  } & got.GotFn

  type GhGotOptions = got.GotJSONOptions & {
    token?: string
    baseUrl?: string
  }

  type GhGotInstance<T = GhGotFn> = got.GotInstance<T>
}

export = ghGot
