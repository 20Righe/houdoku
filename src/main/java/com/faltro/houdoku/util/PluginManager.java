package com.faltro.houdoku.util;

import com.faltro.houdoku.plugins.MangaDex;
import com.faltro.houdoku.plugins.MangaHere;

import java.util.ArrayList;
import java.util.Arrays;

public class PluginManager {
    private ArrayList<ContentSource> contentSources;

    public PluginManager() {
        contentSources = new ArrayList<>();
        contentSources.addAll(Arrays.asList(
                new MangaDex(),
                new MangaHere()
                // add other sources here
        ));
    }

    /**
     * Gets the ID of a content source instance.
     *
     * @param contentSource
     * @return the ID of the contentSource's class.
     */
    private int getSourceId(ContentSource contentSource) {
        int result = -1;
        try {
            result = contentSource.getClass().getField("ID").getInt(null);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            e.printStackTrace();
        }
        return result;
    }

    /**
     * Gets the ContentSource instance whose class has the given ID.
     *
     * @param id - the ContentSource ID (the static ID field of the
     *           implementing plugin class)
     * @return the ContentSource instance whose class has the given ID.
     */
    public ContentSource getSource(int id) {
        return contentSources.stream().filter(
                contentSource -> getSourceId(contentSource) == id
        ).findFirst().orElse(null);
    }

    public ArrayList<ContentSource> getContentSources() {
        return contentSources;
    }
}
