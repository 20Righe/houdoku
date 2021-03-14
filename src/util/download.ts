import fs from 'fs';
import { Series } from '../models/types';
import { getThumbnailPath } from './filesystem';

// eslint-disable-next-line import/prefer-default-export
export async function downloadCover(series: Series) {
  const thumbnailPath = await getThumbnailPath(series);
  if (thumbnailPath === null) return;

  // eslint-disable-next-line promise/catch-or-return
  fetch(series.remoteCoverUrl)
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      fs.writeFile(thumbnailPath, Buffer.from(buffer), (err) => {
        if (err) {
          console.error(err);
        }
      });
      return true;
    });
}
