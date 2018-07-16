package com.faltro.houdoku.data;

import com.faltro.houdoku.model.*;
import com.google.gson.*;
import javafx.scene.image.Image;
import javafx.scene.paint.Color;

import java.util.ArrayList;

public class Serializer {
    private static final Gson gson = new Gson();

    /**
     * Serializes a Library object into JSON data.
     *
     * @param library the Library to serialize
     * @return a string contains the JSON representation of the library
     */
    static String serializeLibrary(Library library) {
        JsonObject json_root = new JsonObject();

        JsonArray json_serieses = new JsonArray();
        for (Series series : library.getSerieses()) {
            JsonElement json_series = gson.toJsonTree(series);
            json_serieses.add(json_series);
        }

        json_root.add("library", json_serieses);
        json_root.add("categories", gson.toJsonTree(library.getRootCategory()));

        return json_root.toString();
    }

    /**
     * Deserializes JSON data into a Library object.
     *
     * @param data a string representing the JSON data to deserialize.
     * @return a Library based on the given data
     */
    static Library deserializeLibrary(String data) {
        JsonObject json_root = new JsonParser().parse(data).getAsJsonObject();

        JsonElement json_serieses = json_root.get("library");
        ArrayList<Series> serieses = new ArrayList<>();
        for (JsonElement json_series : json_serieses.getAsJsonArray()) {
            Series series = gson.fromJson(json_series, Series.class);

            // manually set basic fields for all of this series' chapters that
            // are not serialized
            for (Chapter chapter : series.getChapters()) {
                chapter.setSeries(series);
                chapter.images = new Image[1];
            }

            serieses.add(series);
        }

        JsonElement json_categories = json_root.get("categories");
        Category root_category = parseCategories(json_categories.getAsJsonObject(), null);

        return new Library(serieses, root_category);
    }

    /**
     * Serializes a Config object into JSON data.
     *
     * @param config the Config to serialize
     * @return a string contains the JSON representation of the config
     */
    static String serializeConfig(Config config) {
        JsonElement json = gson.toJsonTree(config);
        return json.toString();
    }

    /**
     * Deserializes JSON data into a Config object.
     *
     * @param data a string representing the JSON data to deserialize.
     * @return a Config based on the given data
     */
    static Config deserializeConfig(String data) {
        JsonElement json = new JsonParser().parse(data).getAsJsonObject();
        return gson.fromJson(json, Config.class);
    }

    /**
     * Recursively parse a category from the given JSON tree.
     * <p>
     * The given JsonObject should contain the following fields: name, which is
     * a string; color, which can be parsed as a Color; subcategories, which
     * is an array of other categories.
     *
     * @param json_categories a JsonObject matching the details described above
     * @param parent          the parent category of the root of json_categories, or null
     * @return a category with a complete subcategory tree from the given JSON
     */
    private static Category parseCategories(JsonObject json_categories, Category parent) {
        Category category = new Category(json_categories.get("name").getAsString(), parent);

        JsonArray json_subcategories = json_categories.get("subcategories").getAsJsonArray();
        if (json_subcategories.size() > 0) {
            for (JsonElement json_subcategory : json_subcategories) {
                category.addSubcategory(
                        parseCategories(json_subcategory.getAsJsonObject(), category));
            }
        }

        return category;
    }

    /**
     * Parse a Color from the given JSON object.
     * <p>
     * The given JsonObject should contain the following fields: red; blue;
     * green; opacity, which are all doubles. The platformPaint field, which
     * may exist, is simply ignored.
     *
     * @param json_color a JsonObject matching the details described above
     * @return a Color using the values from the given JSON
     */
    private static Color parseColor(JsonObject json_color) {
        double red = json_color.get("red").getAsDouble();
        double blue = json_color.get("blue").getAsDouble();
        double green = json_color.get("green").getAsDouble();
        double opacity = json_color.get("opacity").getAsDouble();
        return new Color(red, blue, green, opacity);
    }
}
