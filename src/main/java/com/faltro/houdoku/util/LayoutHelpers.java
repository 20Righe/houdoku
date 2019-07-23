package com.faltro.houdoku.util;

import javafx.geometry.Pos;
import javafx.geometry.Rectangle2D;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.effect.ColorAdjust;
import javafx.scene.effect.DropShadow;
import javafx.scene.image.ImageView;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;

public class LayoutHelpers {
    /**
     * ColorAdjust for the banner on the {@link com.faltro.houdoku.controller.SeriesController}
     * page.
     */
    public static final ColorAdjust BANNER_ADJUST = new ColorAdjust(0, 0, -0.5, 0);
    /**
     * ColorAdjust for non-hovered cover images.
     */
    public static final ColorAdjust COVER_ADJUST_DEFAULT = new ColorAdjust(0, 0, -0.2, 0);
    /**
     * DropShadow for cover images.
     */
    private static final DropShadow COVER_DROPSHADOW = new DropShadow(5, Color.BLACK);
    /**
     * ColorAdjust for hovered cover images.
     */
    private static final ColorAdjust COVER_ADJUST_HOVER = new ColorAdjust(0, 0, -0.5, 0);
    /**
     * The height/width ratio of displayed cover images.
     */
    private static final double COVER_RATIO = 1.5;

    static {
        COVER_ADJUST_DEFAULT.setInput(COVER_DROPSHADOW);
        COVER_ADJUST_HOVER.setInput(COVER_DROPSHADOW);
    }

    /**
     * Apply the correct aspect ratio for covers to the given ImageView.
     * 
     * This method does not specify a width for the ImageView itself.
     * 
     * The ImageView's image should be set AFTER this method is called, but the aspect ratio will be
     * applied whenever the image is changed.
     * 
     * @param image_view the ImageView for a cover to apply the aspect ratio to
     */
    public static void applyCoverSizing(ImageView image_view) {
        image_view.setPreserveRatio(true);
        image_view.imageProperty().addListener((observableValue, oldValue, image) -> {
            double ih = image.getHeight();
            double iw = image.getWidth();
            double image_ratio = ih / iw;
            double vp_width = image_ratio < COVER_RATIO ? ih / COVER_RATIO : iw;
            double vp_height = image_ratio < COVER_RATIO ? ih : iw * COVER_RATIO;
            double offset_x = (iw - vp_width) / 2;
            double offset_y = (ih - vp_height) / 2;
            image_view.setViewport(new Rectangle2D(offset_x, offset_y, vp_width, vp_height));
        });
    }

    /**
     * Create the container for displaying a series cover, for use in FlowPane layouts where covers
     * are shown in a somewhat grid-like fashion.
     *
     * @param container the parent FlowPane container
     * @param title     the title of the series being represented
     * @param cover     the cover of the series being represented; this ImageView is not modified, a
     *                  copy is made to be used in the new container
     * @return a StackPane which displays the provided title and cover and can be added to the
     *         FlowPane
     */
    public static StackPane createCoverContainer(FlowPane container, String title,
            ImageView cover) {
        StackPane result_pane = new StackPane();
        result_pane.setAlignment(Pos.BOTTOM_LEFT);

        // create the label for showing the series title
        Label label = new Label();
        label.setText(title);
        label.getStyleClass().add("coverLabel");
        label.setWrapText(true);

        // We create a new ImageView for the cell instead of using the result's cover ImageView
        // since we may not want to mess with the sizing of the result's cover -- particularly if we
        // want to have additional result layouts.
        ImageView image_view = new ImageView();
        applyCoverSizing(image_view);
        image_view.fitWidthProperty().bind(result_pane.prefWidthProperty());
        image_view.imageProperty().bind(cover.imageProperty());

        image_view.setEffect(COVER_ADJUST_DEFAULT);
        image_view.getStyleClass().add("coverImage");

        // create the mouse event handlers for the result pane
        result_pane.setOnMouseEntered(t -> {
            image_view.setEffect(COVER_ADJUST_HOVER);
            setChildButtonVisible(result_pane, true);
        });
        result_pane.setOnMouseExited(t -> {
            image_view.setEffect(COVER_ADJUST_DEFAULT);
            setChildButtonVisible(result_pane, false);
        });

        result_pane.getChildren().addAll(image_view, label);

        return result_pane;
    }

    /**
     * Create the container for displaying a series cover, for use in FlowPane layouts where covers
     * are shown in a somewhat grid-like fashion. However this includes a count of the amount of
     * chapters that have been marked as read. The count is displayed in the top right corner.
     *
     * @param container         the parent FlowPane container
     * @param title             the title of the series being represented
     * @param cover             the cover of the series being represented; this ImageView is not
     *                          modified, a copy is made to be used in the new container
     * @param numUnreadChapters the amount of Chapters that have been marked as unread
     * @return a StackPane which displays the provided title and cover and can be added to the
     *         FlowPane
     */
    public static StackPane createCoverContainer(FlowPane container, String title, ImageView cover,
            int numUnreadChapters) {
        String amountOfReadChapters = String.valueOf(numUnreadChapters);

        // We call the other createCoverContainer method to provide a filled stackpane with the
        // title and cover
        StackPane pane = createCoverContainer(container, title, cover);

        // create the label for showing the amount of chapters marked as read
        Label label = new Label();
        label.setText(amountOfReadChapters);
        label.getStyleClass().add("coverLabel");
        label.setWrapText(true);

        // this label will be situated in the top right as the title is located in the bottom left
        StackPane.setAlignment(label, Pos.TOP_RIGHT);

        pane.getChildren().add(label);

        return pane;
    }

    /**
     * Set whether all Button children of the given Parent are visible.
     *
     * @param parent  the parent node
     * @param visible whether the buttons should be visible
     */
    public static void setChildButtonVisible(Parent parent, boolean visible) {
        for (Node child : parent.getChildrenUnmodifiable()) {
            if (child instanceof Button) {
                Button button = (Button) child;
                button.setVisible(visible);
                button.setManaged(visible);
            } else if (child instanceof Parent) {
                setChildButtonVisible((Parent) child, visible);
            }
        }
    }
}
