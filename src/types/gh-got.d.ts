import {
  Got,
  Response,
  OptionsOfJSONResponseBody,
  CancelableRequest,
} from 'got'
import { Url } from 'url'

declare const ghGot: ghGot.GhGotFn

type GotUrl = string | Url

declare namespace ghGot {
  type GhGotFn = {
    (url: GotUrl): CancelableRequest<Response<object>>
    (url: GotUrl, options: GhGotOptions): CancelableRequest<Response<object>>
  } & Got

  type GhGotOptions = OptionsOfJSONResponseBody & {
    token?: string
    prefixUrl?: string
    body?: object
  }
}

export = ghGot
