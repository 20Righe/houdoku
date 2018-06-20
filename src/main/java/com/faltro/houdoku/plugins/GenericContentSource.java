package com.faltro.houdoku.plugins;

import com.faltro.houdoku.exception.ContentUnavailableException;
import com.faltro.houdoku.model.Chapter;
import com.faltro.houdoku.model.Series;
import com.faltro.houdoku.util.ContentSource;
import javafx.scene.image.Image;
import okhttp3.Response;
import org.jsoup.nodes.Document;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;

import static com.faltro.houdoku.net.Requests.GET;

/**
 * This class contains implementations for some methods from ContentSource that
 * are expected to be common between most content source plugins.
 * <p>
 * For method and field documentation, please see the ContentSource class.
 */
public class GenericContentSource implements ContentSource {
    public static final int ID = -1;
    public static final String NAME = "GenericContentSource";
    public static final String DOMAIN = "example.com";
    public static final String PROTOCOL = "https";

    @Override
    public Image imageFromURL(String url) throws IOException {
        Response response = GET(url);
        return new Image(response.body().byteStream());
    }

    @Override
    public ArrayList<HashMap<String, Object>> search(String query) throws IOException {
        return null;
    }

    @Override
    public ArrayList<Chapter> chapters(Series series) throws IOException {
        return null;
    }

    @Override
    public ArrayList<Chapter> chapters(Series series, Document seriesDocument) {
        return null;
    }

    @Override
    public Series series(String source) throws IOException {
        return null;
    }

    @Override
    public Image cover(String source) throws IOException {
        return null;
    }

    @Override
    public Image image(Chapter chapter, int page) throws IOException, ContentUnavailableException {
        return null;
    }

    @Override
    public String toString() {
        String result = NAME + " <" + DOMAIN + ">";
        try {
            String name = this.getClass().getField("NAME").get(null).toString();
            String domain = this.getClass().getField("DOMAIN").get(null).toString();
            result = name + " <" + domain + ">";
        } catch (NoSuchFieldException | IllegalAccessException e) {
            e.printStackTrace();
        }
        return result;
    }
}
