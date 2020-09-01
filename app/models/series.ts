import { v4 as uuidv4 } from 'uuid';

export default class Series {
  title: string;

  author: string;

  uuid: string;

  constructor(title: string, author: string) {
    this.title = title;
    this.author = author;
    this.uuid = uuidv4();
  }
}
