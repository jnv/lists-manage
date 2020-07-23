import {
  Got,
  Response,
  OptionsOfJSONResponseBody,
  CancelableRequest,
} from 'got'
import { Url } from 'url'

declare const ghGot: ghGot.GhGotFn

type GotUrl = string | Url
type GotResponse = CancelableRequest<Response<Record<string, unknown>>>

declare namespace ghGot {
  type GhGotFn = {
    (url: GotUrl): GotResponse
    (url: GotUrl, options: GhGotOptions): GotResponse
  } & Got

  type GhGotOptions = OptionsOfJSONResponseBody & {
    token?: string
    prefixUrl?: string
    body?: Record<string, unknown>
  }
}

export = ghGot
