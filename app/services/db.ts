// eslint-disable-next-line import/no-cycle
import * as db from '../db';
import { Series } from '../models/types';

export default {
  fetchSerieses() {
    return db.database.select().from(db.seriesTable).exec();
  },
  fetchChapters(seriesId: number) {
    return db.database
      .select()
      .from(db.chapterTable)
      .where(db.chapterTable.series_id.eq(seriesId))
      .exec();
  },
  fetchSeries(id: number) {
    return db.database
      .select()
      .from(db.seriesTable)
      .where(db.seriesTable.id.eq(id))
      .exec();
  },
  addSeries(series: Series) {
    return db.database
      .insertOrReplace()
      .into(db.seriesTable)
      .values([db.seriesTable.createRow(series)])
      .exec();
  },
  addChapters(seriesId: number) {
    const values = [];
    for (let i = 0; i < 200; i += 1) {
      const data = {
        title: `chaptertitle${i}`,
        chapterNumber: i,
        volumeNumber: 1,
        series_id: seriesId,
      };

      values.push(db.chapterTable.createRow(data));
    }

    return db.database
      .insertOrReplace()
      .into(db.chapterTable)
      .values(values)
      .exec();
  },
  deleteAllSeries() {
    db.database.delete().from(db.seriesTable).exec();
  },
};
