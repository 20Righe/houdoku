package com.faltro.houdoku.model;

import java.util.HashMap;

/**
 * Stores user-specific config information for the client.
 */
public class Config {
    /**
     * The HashMap of default configuration values.
     */
    private static final HashMap<String, Object> DEFAULTS = new HashMap<>();

    static {
        DEFAULTS.put("night_mode_enabled", false);
        DEFAULTS.put("night_mode_reader_only", false);
        DEFAULTS.put("page_filter_type", "color");
        DEFAULTS.put("page_filter_color_hue", 0.25);
        DEFAULTS.put("page_filter_color_saturation", 0.33);
        DEFAULTS.put("page_filter_brightness", 0.50);
    }

    private HashMap<String, Object> data;

    /**
     * Create a Config instance with data using the default values.
     */
    public Config() {
        data = new HashMap<>(DEFAULTS);
    }

    /**
     * Restore the data to the default values.
     */
    public void restoreDefaults() {
        data = new HashMap<>(DEFAULTS);
    }

    /**
     * Update the value for a field in the config data.
     * <p>
     * This method returns a boolean of whether it was successful in updating
     * the field. It is considered unsuccessful if the given field name is not
     * in the data HashMap, or if the type of the new value does not match the
     * type of the existing value.
     *
     * @param name  the name of the field to update
     * @param value the new value of the field
     * @return whether or not the field was successfully updated
     */
    public boolean updateField(String name, Object value) {
        boolean successful = false;
        if (data.containsKey(name)) {
            if (data.get(name).getClass() == value.getClass()) {
                data.replace(name, value);
                successful = true;
            }
        }
        return successful;
    }

    /**
     * Get the value of the field with the given name.
     *
     * @param name the name of the field to retrieve
     * @return the value of the requested field, or null
     */
    public Object getField(String name) {
        Object result = null;
        if (data.containsKey(name)) {
            result = data.get(name);
        }
        return result;
    }

    /**
     * Get the default value of the field with the given name.
     *
     * @param name the name of the field to retrieve
     * @return the default value of the requested field, or null
     */
    public Object getFieldDefault(String name) {
        Object result = null;
        if (DEFAULTS.containsKey(name)) {
            result = DEFAULTS.get(name);
        }
        return result;
    }
}
