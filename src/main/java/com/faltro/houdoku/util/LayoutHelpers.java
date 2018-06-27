package com.faltro.houdoku.util;

import javafx.geometry.Pos;
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
    private static DropShadow COVER_DROPSHADOW = new DropShadow(5, Color.BLACK);
    private static ColorAdjust COVER_ADJUST_DEFAULT = new ColorAdjust(0, 0, -0.2, 0);
    private static ColorAdjust COVER_ADJUST_HOVER = new ColorAdjust(0, 0, -0.5, 0);

    public static StackPane createCoverContainer(FlowPane container, String title,
                                                 ImageView cover) {
        COVER_ADJUST_DEFAULT.setInput(COVER_DROPSHADOW);
        COVER_ADJUST_HOVER.setInput(COVER_DROPSHADOW);

        StackPane result_pane = new StackPane();
        result_pane.prefWidthProperty().bind(
                container.widthProperty()
                        .divide(5)
                        .subtract(container.getHgap())
        );
        result_pane.setAlignment(Pos.BOTTOM_LEFT);

        // create the label for showing the series title
        Label label = new Label();
        label.setText(title);
        label.getStyleClass().add("coverLabel");
        label.setWrapText(true);

        // We create a new ImageView for the cell instead of using the
        // result's cover ImageView since we may not want to mess with
        // the sizing of the result's cover -- particularly if we want
        // to have additional result layouts.
        ImageView image_view = new ImageView();
        image_view.setPreserveRatio(true);
        image_view.imageProperty().bind(cover.imageProperty());
        image_view.fitWidthProperty().bind(
                result_pane.prefWidthProperty()
        );
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
