import { ISection } from './section'

interface IListFile {
  prefix?: string,
  suffix?: string,
  sections: ISection[],
}
