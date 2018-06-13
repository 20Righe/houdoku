package com.faltro.houdoku.model;

import javafx.scene.paint.Color;
import javafx.scene.text.Text;

import java.util.ArrayList;

public class Category {
    private String name;
    private Color color;
    private ArrayList<Category> subcategories;
    private transient int occurrences;

    public Category(String name) {
        this.name = name;
        this.color = Color.BLACK;
        this.occurrences = 0;
        this.subcategories = new ArrayList<>();
    }

    public Category(String name, Color color) {
        this(name);
        this.color = color;
        this.subcategories = new ArrayList<>();
    }

    public static boolean nameIsValid(String name) {
        boolean result = true;
        if (name.equals("")) {
            result = false;
        }
        return result;
    }

    public void addSubcategory(Category category) {
        this.subcategories.add(category);
    }

    public void deltaOccurrences(int delta) {
        occurrences += delta;
    }

    public Category recursiveFindSubcategory(String name) {
        Category result = null;
        if (this.name.toLowerCase().equals(name.toLowerCase())) {
            result = this;
        } else {
            for (Category category : subcategories) {
                Category tempResult = category.recursiveFindSubcategory(name);
                result = tempResult == null ? result : tempResult;
            }
        }
        return result;
    }

    public String getName() {
        return name;
    }

    public Color getColor() {
        return color;
    }

    public ArrayList<Category> getSubcategories() {
        return subcategories;
    }

    public int getOccurrences() {
        return occurrences;
    }

    public void setOccurrences(int occurrences) {
        this.occurrences = occurrences;
    }

    public String toString() {
        return name + " (" + Integer.toString(occurrences) + ")";
    }

    public Text asText() {
        Text text = new Text(toString());
        //text.getStyleClass().add("categoryText");
        text.setFill(color);
        return text;
    }

    public boolean equals(Category category) {
        return name.toLowerCase().equals(category.name.toLowerCase());
    }
}
