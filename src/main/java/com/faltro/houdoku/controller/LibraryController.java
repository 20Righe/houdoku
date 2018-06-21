package com.faltro.houdoku.controller;

import com.faltro.houdoku.model.Category;
import com.faltro.houdoku.model.Library;
import com.faltro.houdoku.model.Series;
import com.faltro.houdoku.util.SceneManager;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.collections.transformation.SortedList;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;
import javafx.fxml.FXML;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.MouseButton;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import javafx.scene.text.TextAlignment;

import java.util.ArrayList;

public class LibraryController extends Controller {
    public static final int ID = 0;
    /**
     * The initial position of the divider between the tree and table.
     */
    private static final float DEFAULT_CONTENT_DIVIDER_POS = 0.3f;
    private static final double COL_COVER_WIDTH = 0.1;
    private static final double COL_TITLE_WIDTH = 0.7;
    private static final double COL_NUMCHAPTERS_WIDTH = 0.2;

    private Library library;

    @FXML
    private VBox container;
    @FXML
    private MenuBar menuBar;
    @FXML
    private SplitPane contentContainer;
    @FXML
    private TreeTableView<Category> treeView;
    @FXML
    private TableView<Series> tableView;
    @FXML
    private TreeTableColumn<Category, Text> categoriesColumn;
    @FXML
    private TableColumn<Series, Image> coverColumn;
    @FXML
    private TableColumn<Series, String> titleColumn;
    @FXML
    private TableColumn<Series, String> numChaptersColumn;
    @FXML
    private HBox actionBar;
    @FXML
    private HBox filterBar;
    @FXML
    private TextField filterTextField;
    @FXML
    private CheckMenuItem compactItem;
    @FXML
    private CheckMenuItem showActionBarItem;

    public LibraryController(SceneManager sceneManager) {
        super(sceneManager);
        this.library = new Library();
    }

    /**
     * Initialize the components of the controller's view.
     * <p>
     * This method binds the size of components as appropriate using this class'
     * static variables. It creates and sets the cell factory and cell value
     * factory for the columns in the series table. It also creates the items
     * in the category tree using the root category from the library.
     *
     * @see Controller#initialize()
     */
    @Override
    @FXML
    public void initialize() {
        super.initialize();

        contentContainer.setDividerPosition(0, DEFAULT_CONTENT_DIVIDER_POS);

        // bind column widths to a percentage of the table width
        // manually resizing columns (by user) is disabled in the fxml
        categoriesColumn.prefWidthProperty().bind(
                treeView.widthProperty()
                        .subtract(3) // to account for border between tables
        );
        coverColumn.prefWidthProperty().bind(
                tableView.widthProperty()
                        .multiply(COL_COVER_WIDTH)
        );
        titleColumn.prefWidthProperty().bind(
                tableView.widthProperty()
                        .multiply(COL_TITLE_WIDTH)
        );
        numChaptersColumn.prefWidthProperty().bind(
                tableView.widthProperty()
                        .multiply(COL_NUMCHAPTERS_WIDTH)
                        .subtract(SceneManager.VSCROLLBAR_WIDTH) // to account for scrollbar
        );

        // create a right-click context menu for all table cells
        // onAction events are set by newCellClickHandler()
        ContextMenu cellContextMenu = new ContextMenu();
        cellContextMenu.getItems().addAll(
                new MenuItem("View Series"),
                new MenuItem("Edit Categories"),
                new MenuItem("Remove Series")
        );

        // create a right-click context menu for categories
        // onAction events are set by newCategoryClickHandler()
        ContextMenu categoryContextMenu = new ContextMenu();
        categoryContextMenu.getItems().addAll(
                new MenuItem("Add Category"),
                new MenuItem("Edit Category")
        );

        // Create factories for table cells for each column.
        // All cell nodes use the tableCell class
        // Cover column:
        //   Cell graphics are an ImageView with a width equal to the width of
        //   the column.
        // Title column:
        //   Cell graphics are a Text node using the tableText class, which
        //   centers it.
        // Num chapters column:
        //   Cell graphics are a Text node using the tableText class, which
        //   centers it.
        coverColumn.setCellFactory(tc -> {
            TableCell<Series, Image> cell = new TableCell<>();
            cell.getStyleClass().add("tableCell");
            ImageView imageView = new ImageView();
            imageView.imageProperty().bind(cell.itemProperty());
            imageView.fitWidthProperty().bind(coverColumn.widthProperty());
            imageView.setPreserveRatio(true);
            cell.setGraphic(imageView);
            cell.setOnMouseClicked(newCellClickHandler(cellContextMenu));
            return cell;
        });
        titleColumn.setCellFactory(tc -> {
            TableCell<Series, String> cell = new TableCell<>();
            cell.getStyleClass().add("tableCell");
            Text text = new Text();
            text.getStyleClass().add("tableText");
            text.setTextAlignment(TextAlignment.LEFT);
            text.wrappingWidthProperty().bind(titleColumn.widthProperty());
            text.textProperty().bind(cell.itemProperty());
            text.setLineSpacing(7);
            cell.setGraphic(text);
            cell.setOnMouseClicked(newCellClickHandler(cellContextMenu));
            return cell;
        });
        numChaptersColumn.setCellFactory(tc -> {
            TableCell<Series, String> cell = new TableCell<>();
            cell.getStyleClass().add("tableCell");
            Text text = new Text();
            text.getStyleClass().add("tableText");
            text.setTextAlignment(TextAlignment.CENTER);
            cell.setGraphic(text);
            cell.setPrefHeight(Control.USE_COMPUTED_SIZE);
            cell.setAlignment(Pos.CENTER);
            text.setTextAlignment(TextAlignment.CENTER);
            text.wrappingWidthProperty().bind(numChaptersColumn.widthProperty());
            text.textProperty().bind(cell.itemProperty());
            cell.setOnMouseClicked(newCellClickHandler(cellContextMenu));
            return cell;
        });

        // create table cell value factories for each column which simply get
        // the appropriate value from the series object
        coverColumn.setCellValueFactory(p -> new SimpleObjectProperty<>(p.getValue().getCover()));
        titleColumn.setCellValueFactory(p -> new SimpleStringProperty(
                // This column actually shows the series title, followed by
                // artist and author on the following line. If the author
                // is the same as the artist, we simply show the name once.
                // If compact mode is enabled, we also opt to only show the
                // title of the series.
                compactItem.isSelected() ? p.getValue().getTitle() :
                        p.getValue().author.equals(p.getValue().artist) ?
                                p.getValue().getTitle() + "\n" + p.getValue().author :
                                p.getValue().getTitle() + "\n" + p.getValue().author + "/" +
                                        p.getValue().artist
        ));
        numChaptersColumn.setCellValueFactory(p -> new SimpleStringProperty(
                Integer.toString(p.getValue().getNumHighestChapter())
        ));

        // create cell/value factories for the tree which use
        // the category's asText()
        categoriesColumn.setCellFactory(tc -> {
            TreeTableCell<Category, Text> cell = new TreeTableCell<>();
            cell.graphicProperty().bind(cell.itemProperty());
            cell.setOnMouseClicked(newCategoryClickHandler(categoryContextMenu));
            return cell;
        });
        categoriesColumn.setCellValueFactory(p ->
                new SimpleObjectProperty<>(p.getValue().getValue().asText())
        );

        // Create TreeItem's and set them as children of each other, where
        // appropriate. The maximum height of the tree is 3 (including the
        // required "All Series" root).
        treeView.setRoot(null);

        Category rootCategory = library.getRootCategory();
        TreeItem<Category> rootItem = new TreeItem<>(rootCategory);
        rootItem.setExpanded(true);

        for (Category c1 : rootCategory.getSubcategories()) {
            TreeItem<Category> t1 = new TreeItem<>(c1);
            t1.setExpanded(true);
            for (Category c2 : c1.getSubcategories()) {
                TreeItem<Category> t2 = new TreeItem<>(c2);
                t2.setExpanded(true);
                t1.getChildren().add(t2);
            }
            rootItem.getChildren().add(t1);
        }

        library.calculateCategoryOccurrences();
        treeView.setRoot(rootItem);
        treeView.getSelectionModel().selectFirst();

        updateContent();
    }

    /**
     * @see Controller#onMadeActive()
     */
    public void onMadeActive() {
        // hack to force the table's FilteredList to update, since series
        // info may have changed since returning to this scene
        filterTextField.setText(".");
        filterTextField.setText("");
    }

    /**
     * @see Controller#onMadeInactive()
     */
    @Override
    public void onMadeInactive() {
    }

    /**
     * Populates the tableView and treeView with series from the library.
     * <p>
     * This function should be run whenever there is a possibility that a series
     * has been added or removed from the library. It does not need to be run
     * whenever the properties of a series changes, since the cell factories
     * will handle that properly with just tableView.refresh().
     */
    public void updateContent() {
        // Use filterTextField to filter series in table by title
        // Filter code/method derived from
        //   http://code.makery.ch/blog/javafx-8-tableview-sorting-filtering
        // with minor changes.
        // 1. Wrap the ObservableList in a FilteredList (initially display
        //    all data).
        // 2. Set the filter Predicate whenever the filter changes.
        // 3. Wrap the FilteredList in a SortedList.
        // 4. Bind the SortedList comparator to the TableView comparator.
        // 5. Add sorted (and filtered) data to the table.
        ObservableList<Series> masterData = FXCollections.observableArrayList(
                library.getSerieses()
        );
        FilteredList<Series> filteredData = new FilteredList<>(masterData, p -> true);

        filterTextField.textProperty().addListener(
                (observable, oldValue, newValue) ->
                        setCombinedPredicate(filteredData)
        );
        treeView.getSelectionModel().selectedItemProperty().addListener(
                (observable, oldValue, newValue) ->
                        setCombinedPredicate(filteredData)
        );

        SortedList<Series> sortedData = new SortedList<>(filteredData);
        sortedData.comparatorProperty().bind(tableView.comparatorProperty());

        tableView.setItems(sortedData);

        // recalculate category occurrences for display in the treeView
        library.calculateCategoryOccurrences();
        treeView.refresh();
    }

    /**
     * Set the predicate of the series table's FilteredList.
     * <p>
     * This method filters the given list based on the contents of the
     * filterTextField and on the selected category.
     * <p>
     * This method needs to be called whenever actions which could change the
     * predicate are performed - i.e., clicking a category.
     *
     * @param filteredData the FilteredList of series to set the predicate of
     */
    private void setCombinedPredicate(FilteredList<Series> filteredData) {
        filteredData.setPredicate(series -> {
            // check that the series title, author, or artist contains the
            // text filter
            String filter = filterTextField.getText().toLowerCase();
            boolean titleMatches = series.getTitle().toLowerCase().contains(filter);
            boolean creatorMatches = series.author.toLowerCase().contains(filter) ||
                    series.artist.toLowerCase().contains(filter);

            // check that the series has the selected category
            TreeItem<Category> selectedTreeCell = treeView.getSelectionModel().getSelectedItem();
            Category category = selectedTreeCell.getValue();
            boolean categoryMatches = series.getStringCategories().stream().anyMatch(
                    stringCategory -> stringCategory.equals(category.getName()) ||
                            category.recursiveFindSubcategory(stringCategory) != null
            ) || category.equals(library.getRootCategory());

            return (titleMatches || creatorMatches) && categoryMatches;
        });
    }

    /**
     * Creates a MouseEvent handler for a cell in the series table.
     * <p>
     * This handler handles double clicking to go to a series' page, as well as
     * handling the actions of the given context menu if a series is right
     * clicked.
     *
     * @param contextMenu the context menu shown when right clicking
     * @return a complete MouseEvent EventHandler for a cell in the series table
     */
    private EventHandler<MouseEvent> newCellClickHandler(ContextMenu contextMenu) {
        return mouseEvent -> {
            if (mouseEvent.getButton().equals(MouseButton.PRIMARY)) {
                if (mouseEvent.getClickCount() == 2) {
                    Series series = tableView.getSelectionModel().getSelectedItem();
                    goToSeries(series);
                } else if (mouseEvent.getClickCount() == 1) {
                    contextMenu.hide();
                }
            } else if (mouseEvent.getButton().equals(MouseButton.SECONDARY)) {
                if (mouseEvent.getClickCount() == 1) {
                    Series series = tableView.getSelectionModel().getSelectedItem();
                    contextMenu.getItems().get(0).setOnAction(e -> goToSeries(series));
                    contextMenu.getItems().get(1).setOnAction(e -> promptEditCategories(series));
                    contextMenu.getItems().get(2).setOnAction(e -> promptRemoveSeries(series));
                    contextMenu.show(tableView, mouseEvent.getScreenX(), mouseEvent.getScreenY());
                }
            }
        };
    }

    /**
     * Creates a MouseEvent handler for a category in the categories tree.
     * <p>
     * The handler does not trigger a filter of the series table's data when
     * a category is clicked. That is done by adding a listener to the tree's
     * selection property. Instead, this handler primarily handles the actions
     * of the given context menu when a category is right clicked.
     *
     * @param contextMenu the context menu shown when right clicking
     * @return a complete MouseEvent EventHandler for a category in the tree
     */
    private EventHandler<MouseEvent> newCategoryClickHandler(ContextMenu contextMenu) {
        return mouseEvent -> {
            if (mouseEvent.getButton().equals(MouseButton.PRIMARY)) {
                if (mouseEvent.getClickCount() == 1) {
                    contextMenu.hide();
                }
            } else if (mouseEvent.getButton().equals(MouseButton.SECONDARY)) {
                Category category = treeView.getSelectionModel().getSelectedItem().getValue();
                contextMenu.getItems().get(0).setOnAction(e -> promptAddCategory(category));
                contextMenu.getItems().get(1).setOnAction(e -> promptEditCategory(category));
                contextMenu.show(treeView, mouseEvent.getScreenX(), mouseEvent.getScreenY());
            }
        };
    }

    /**
     * Retrieves the TreeItem of the tree corresponding to the given category.
     * <p>
     * If the category is not in the tree, this method will return null.
     *
     * @param category the category to search for in the tree
     * @return the TreeItem corresponding to the given category, or null
     */
    private TreeItem<Category> getTreeItemByCategory(Category category) {
        TreeItem<Category> result = null;
        if (treeView.getRoot().getValue().equals(category)) {
            result = treeView.getRoot();
        } else {
            for (TreeItem<Category> t1 : treeView.getRoot().getChildren()) {
                if (t1.getValue().equals(category)) {
                    result = t1;
                } else {
                    for (TreeItem<Category> t2 : t1.getChildren()) {
                        if (t2.getValue().equals(category)) {
                            result = t2;
                        }
                    }
                }
            }
        }
        return result;
    }

    /**
     * Prompts the user to add a category as a child of the given category.
     *
     * @param category the category which will be the parent of the new
     *                 category, if one is successfully created
     */
    private void promptAddCategory(Category category) {
        // disallow adding categories greater than a certain depth
        if (treeView.getTreeItemLevel(getTreeItemByCategory(category)) < 2) {
            Alert alert = new Alert(Alert.AlertType.NONE, "", ButtonType.OK,
                    ButtonType.CANCEL);

            // create ui elements of alert container
            Label invalid_label = new Label("The category name is not valid.");
            invalid_label.setTextFill(Color.CRIMSON);
            invalid_label.setVisible(false);
            invalid_label.managedProperty().bind(invalid_label.visibleProperty());
            Label name_label = new Label("Enter the name of the new category:");
            name_label.setWrapText(true);
            TextField name_field = new TextField();
            Label color_label = new Label("Category color:");
            ColorPicker color_picker = new ColorPicker();
            color_picker.setValue(Color.BLACK);
            HBox color_container = new HBox();
            color_container.setSpacing(15.0);
            color_container.setAlignment(Pos.CENTER);
            color_container.getChildren().addAll(color_label, color_picker);

            // add content to alert container
            VBox alert_container = new VBox();
            alert_container.setSpacing(10.0);
            alert_container.getChildren().addAll(invalid_label, name_label, name_field,
                    color_container);

            // add validation to "OK" button to prevent alert from closing with
            // invalid data
            final Button btn_ok = (Button) alert.getDialogPane().lookupButton(ButtonType.OK);
            btn_ok.addEventFilter(ActionEvent.ACTION, event -> {
                String name = name_field.getText();
                if (!Category.nameIsValid(name) || library.getRootCategory()
                        .recursiveFindSubcategory(name) != null) {
                    // input is invalid -- tell the user and consume the event
                    invalid_label.setVisible(true);
                    event.consume();
                }
            });

            alert.getDialogPane().setContent(alert_container);
            alert.setTitle(stage.getTitle());
            alert.showAndWait();

            if (alert.getResult() == ButtonType.OK) {
                // we have already validated that the category can be created
                Category new_category = new Category(name_field.getText(), color_picker.getValue());
                category.addSubcategory(new_category);

                // add the new category to the tree
                TreeItem<Category> tree_item = new TreeItem<>(new_category);
                getTreeItemByCategory(category).getChildren().add(tree_item);
                updateContent();

            }
        } else {
            Alert alert = new Alert(Alert.AlertType.INFORMATION,
                    "This category is already at the maximum depth.", ButtonType.OK);
            alert.setTitle(stage.getTitle());
            alert.showAndWait();
        }
    }

    /**
     * Prompts the user to edit the given category.
     * <p>
     * The dialog prompt allows the user to alter both the color and text of the
     * category. The dialog is identical to that from promptAddCategory, but we
     * will keep them separate in case we want them to have somewhat different
     * functionality in the future.
     *
     * @param category the category to edit
     */
    private void promptEditCategory(Category category) {
        Alert alert = new Alert(Alert.AlertType.NONE, "", ButtonType.OK,
                ButtonType.CANCEL);

        // create ui elements of alert container
        Label invalid_label = new Label("The category name is not valid.");
        invalid_label.setTextFill(Color.CRIMSON);
        invalid_label.setVisible(false);
        invalid_label.managedProperty().bind(invalid_label.visibleProperty());
        Label name_label = new Label("Enter the name of the category:");
        name_label.setWrapText(true);
        TextField name_field = new TextField();
        name_field.setText(category.getName());
        Label color_label = new Label("Category color:");
        ColorPicker color_picker = new ColorPicker();
        color_picker.setValue(category.getColor());
        HBox color_container = new HBox();
        color_container.setSpacing(15.0);
        color_container.setAlignment(Pos.CENTER);
        color_container.getChildren().addAll(color_label, color_picker);

        // add content to alert container
        VBox alert_container = new VBox();
        alert_container.setSpacing(10.0);
        alert_container.getChildren().addAll(invalid_label, name_label, name_field,
                color_container);

        // add validation to "OK" button to prevent alert from closing with
        // invalid data
        final Button btn_ok = (Button) alert.getDialogPane().lookupButton(ButtonType.OK);
        btn_ok.addEventFilter(ActionEvent.ACTION, event -> {
            String name = name_field.getText();
            if (!Category.nameIsValid(name) || library.getRootCategory()
                    .recursiveFindSubcategory(name) != null) {
                // nameIsValid will be false if the name is unchanged, since
                // creating a category with an existing name is not allowed.
                // In this case, we simply want to ignore that scenario.
                if (!name.toLowerCase().equals(category.getName().toLowerCase())) {
                    // input is invalid -- tell the user and consume the event
                    invalid_label.setVisible(true);
                    event.consume();
                }
            }
        });

        alert.getDialogPane().setContent(alert_container);
        alert.setTitle(stage.getTitle());
        alert.showAndWait();

        if (alert.getResult() == ButtonType.OK) {
            // we have already validated the new name
            category.setName(name_field.getText());
            category.setColor(color_picker.getValue());

            // update/refresh the tree
            updateContent();

        }
    }

    /**
     * Prompts the user to edit the categories of the given series.
     *
     * @param series the series to edit
     */
    private void promptEditCategories(Series series) {
        Alert alert = new Alert(Alert.AlertType.NONE, "", ButtonType.OK,
                ButtonType.CANCEL);

        // create ui elements of alert container
        Label categories_label = new Label("Choose the categories for this series:");
        categories_label.setWrapText(true);

        ArrayList<CheckBox> categories_boxes = new ArrayList<>();
        for (Category category1 : library.getRootCategory().getSubcategories()) {
            CheckBox checkbox1 = new CheckBox(category1.getName());
            checkbox1.setSelected(series.getStringCategories().stream().anyMatch(
                    name -> name.toLowerCase().equals(category1.getName().toLowerCase())
            ));
            categories_boxes.add(checkbox1);
            for (Category category2 : category1.getSubcategories()) {
                CheckBox checkbox2 = new CheckBox(category2.getName());
                checkbox2.setSelected(series.getStringCategories().stream().anyMatch(
                        name -> name.toLowerCase().equals(category2.getName().toLowerCase())
                ));
                categories_boxes.add(checkbox2);
            }
        }

        // add content to alert container
        VBox alert_container = new VBox();
        alert_container.setSpacing(10);
        ScrollPane categories_scrollpane = new ScrollPane();
        categories_scrollpane.setMaxHeight(300);
        VBox categories_container = new VBox();
        categories_container.setSpacing(10);
        categories_container.getChildren().addAll(categories_label);
        categories_container.getChildren().addAll(categories_boxes);
        categories_scrollpane.setContent(categories_container);
        alert_container.getChildren().addAll(categories_label, categories_scrollpane);

        alert.getDialogPane().setContent(alert_container);
        alert.setTitle(stage.getTitle());
        alert.showAndWait();

        if (alert.getResult() == ButtonType.OK) {
            // recreate the series' stringCategories to match selected checkboxes
            ArrayList<String> newStringCategories = new ArrayList<>();
            for (CheckBox checkbox : categories_boxes) {
                if (checkbox.isSelected()) {
                    newStringCategories.add(checkbox.getText());
                }
            }
            series.setStringCategories(newStringCategories);
            updateContent();
        }
    }

    /**
     * Prompts the user to remove the given series.
     *
     * @param series the series to be removed
     */
    private void promptRemoveSeries(Series series) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION, "", ButtonType.YES,
                ButtonType.CANCEL);

        Label label = new Label("Are you sure you want to remove this series from your " +
                "library?\n\n\"" + series.getTitle() + "\"");
        label.setWrapText(true);

        VBox alert_container = new VBox();
        alert_container.getChildren().add(label);

        alert.getDialogPane().setContent(alert_container);
        alert.setTitle(stage.getTitle());
        alert.showAndWait();

        if (alert.getResult() == ButtonType.YES) {
            library.removeSeries(series);
            updateContent();
        }
    }

    /**
     * Changes to the series page for the given series.
     *
     * @param series the series to be viewed
     */
    private void goToSeries(Series series) {
        SeriesController seriesController =
                (SeriesController) sceneManager.getController(SeriesController.ID);
        seriesController.setSeries(series);
        sceneManager.changeToRoot(SeriesController.ID);
    }

    /**
     * Prompts the user to remove the selected series.
     * <p>
     * If no series is selected, this function does nothing.
     */
    @FXML
    public void promptRemoveSelectedSeries() {
        Series series = tableView.getSelectionModel().getSelectedItem();
        if (series != null) {
            promptRemoveSeries(series);
        }

    }

    /**
     * Toggle whether the compact view is enabled.
     * <p>
     * Enabling the compact view removes the cover column of the series table,
     * making the height of each row much smaller.
     */
    @FXML
    public void toggleCompact() {
        coverColumn.setVisible(!compactItem.isSelected());
        if (compactItem.isSelected()) {
            titleColumn.prefWidthProperty().bind(
                    tableView.widthProperty()
                            .multiply(COL_TITLE_WIDTH + COL_COVER_WIDTH));
        } else {
            titleColumn.prefWidthProperty().bind(
                    tableView.widthProperty()
                            .multiply(COL_TITLE_WIDTH));
        }
    }

    /**
     * Creates a new window with the SearchSeries view.
     */
    @FXML
    public void goToSearchSeries() {
        sceneManager.createSceneNewWindow(SearchSeriesController.ID);
    }

    /**
     * Changes to the series page with the selected series.
     * <p>
     * If no series is selected, this function does nothing.
     */
    @FXML
    private void goToSelectedSeries() {
        Series series = tableView.getSelectionModel().getSelectedItem();
        if (series != null) {
            goToSeries(series);
        }
    }

    /**
     * Toggles whether the action bar is visible.
     * <p>
     * The action bar is the bar above the tree and table with buttons for
     * common actions, i.e. "Add Series", "Remove Series".
     */
    @FXML
    private void toggleActionBar() {
        actionBar.setVisible(showActionBarItem.isSelected());
        actionBar.setManaged(actionBar.isVisible());
    }

    public Library getLibrary() {
        return library;
    }
}