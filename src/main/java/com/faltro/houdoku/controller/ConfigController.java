package com.faltro.houdoku.controller;

import com.faltro.houdoku.exception.NotAuthenticatedException;
import com.faltro.houdoku.exception.NotImplementedException;
import com.faltro.houdoku.model.Config;
import com.faltro.houdoku.model.Languages;
import com.faltro.houdoku.model.Languages.Language;
import com.faltro.houdoku.plugins.content.ContentSource;
import com.faltro.houdoku.plugins.tracker.AniList;
import com.faltro.houdoku.plugins.tracker.Kitsu;
import com.faltro.houdoku.plugins.tracker.Tracker;
import com.faltro.houdoku.plugins.tracker.TrackerOAuth;
import com.faltro.houdoku.util.PluginManager;
import com.faltro.houdoku.util.SceneManager;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.effect.ColorAdjust;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.text.Text;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;

/**
 * The controller for the config page.
 * <p>
 * The FXML file for this view is at resources/fxml/config.fxml
 *
 * @see Controller
 */
public class ConfigController extends Controller {
    public static final int ID = 4;
    /**
     * The width of the list of topics as a multiplier of the container width.
     */
    private static final double TOPIC_LIST_WIDTH = 0.25;
    /**
     * A mapping of topic names and the string to their matching icon file.
     */
    private static final HashMap<String, String> ICON_MAP = new HashMap<>();

    static {
        ICON_MAP.put("General", "/img/icon_settings.png");
        ICON_MAP.put("Reader", "/img/icon_reader.png");
        ICON_MAP.put("Plugins", "/img/icon_plugins.png");
        ICON_MAP.put("Trackers", "/img/icon_trackers.png");
    }

    @FXML
    private VBox container;
    @FXML
    private ListView<HBox> listView;
    @FXML
    private VBox configContentContainer;
    @FXML
    private CheckBox nightModeCheck;
    @FXML
    private CheckBox nightModeReaderCheck;
    @FXML
    private CheckBox quickReloadCheck;
    @FXML
    private CheckBox languageFilterCheck;
    @FXML
    private ComboBox<Language> languageFilterBox;
    @FXML
    private CheckBox effectNightModeOnlyCheck;
    @FXML
    private CheckBox effectColorCheck;
    @FXML
    private VBox effectColorBox;
    @FXML
    private CheckBox effectBrightnessCheck;
    @FXML
    private VBox effectBrightnessBox;
    @FXML
    private Slider filterHueSlider;
    @FXML
    private Label filterHueSliderLabel;
    @FXML
    private Slider filterSaturationSlider;
    @FXML
    private Label filterSaturationSliderLabel;
    @FXML
    private Slider filterBrightnessSlider;
    @FXML
    private Label filterBrightnessSliderLabel;
    @FXML
    private ImageView effectPreview;
    @FXML
    private CheckBox restrictPreloadingCheck;
    @FXML
    private HBox preloadingAmountBox;
    @FXML
    private CheckBox invertReadingCheckbox;
    @FXML
    private Spinner<Integer> preloadingAmountSpinner;
    @FXML
    private Button readerKeyPrevPage;
    @FXML
    private Button readerKeyNextPage;
    @FXML
    private Button readerKeyFirstPage;
    @FXML
    private Button readerKeyLastPage;
    @FXML
    private Button readerKeyToSeries;
    @FXML
    private ListView<HBox> contentSourcesList;
    @FXML
    private VBox anilistErrorBox;
    @FXML
    private TextField authUrlFieldAniList;
    @FXML
    private TextField tokenFieldAniList;
    @FXML
    private Label statusAniList;
    @FXML
    private CheckBox updateAutoCheckAniList;
    @FXML
    private VBox kitsuErrorBox;
    @FXML
    private TextField usernameFieldKitsu;
    @FXML
    private TextField passwordFieldKitsu;
    @FXML
    private Label statusKitsu;
    @FXML
    private CheckBox updateAutoCheckKitsu;
    @FXML
    private Label statusPlugins;

    public ConfigController(SceneManager sceneManager) {
        super(sceneManager);
    }

    /**
     * Initialize the components of the controller's view.
     *
     * @see Controller#initialize()
     */
    @Override
    @FXML
    public void initialize() {
        super.initialize();

        // set the width of the topic listView
        listView.prefWidthProperty().bind(container.widthProperty().multiply(TOPIC_LIST_WIDTH));

        // populate the listView with topics
        ObservableList<HBox> items = FXCollections.observableArrayList();
        for (Node node : configContentContainer.getChildren()) {
            String topic_name = node.getUserData().toString();
            HBox item_container = new HBox();
            item_container.getStyleClass().add("listItem");
            Text item_text = new Text(topic_name);
            Image item_image = new Image(ICON_MAP.get(topic_name));
            ImageView item_imageview = new ImageView(item_image);
            item_container.getChildren().add(item_imageview);
            item_container.getChildren().add(item_text);
            items.add(item_container);
        }
        listView.setItems(items);

        // add listener to update the content panel when items are selected
        listView.getSelectionModel().selectedItemProperty()
                .addListener((observableValue, hBox, t1) -> updateContent());

        // Bind the disable property of checkboxes with sub-boxes with the
        // matching sub-box. We would have liked to do this in the FXML file,
        // but there appears to be no way to bind with the inverse of a property
        // in FXML.
        effectColorBox.disableProperty().bind(effectColorCheck.selectedProperty().not());
        effectBrightnessBox.disableProperty().bind(effectBrightnessCheck.selectedProperty().not());

        // add bindings for page color/brightness filter previews
        filterHueSlider.valueProperty()
                .addListener((observableValue, oldValue, newValue) -> updateEffectPreview());
        filterSaturationSlider.valueProperty()
                .addListener((observableValue, oldValue, newValue) -> updateEffectPreview());
        filterBrightnessSlider.valueProperty()
                .addListener((observableValue, oldValue, newValue) -> updateEffectPreview());

        // add bindings for miscellaneous properties
        nightModeReaderCheck.disableProperty().bind(nightModeCheck.selectedProperty().not());
        languageFilterBox.disableProperty().bind(languageFilterCheck.selectedProperty().not());
        preloadingAmountBox.disableProperty()
                .bind(restrictPreloadingCheck.selectedProperty().not());

        // add KeyEvent handlers for navigation
        container.setOnKeyPressed(keyEvent -> {
            if (keyEvent.getEventType() == KeyEvent.KEY_PRESSED) {
                if (keyEvent.getCode() == KeyCode.ESCAPE) {
                    cancel();
                }
            }
        });

        // set available language filters
        ObservableList<Language> languages =
                FXCollections.observableArrayList(Arrays.asList(Languages.Language.values()));
        languageFilterBox.setItems(languages);

        // manually fill auth url fields for trackers
        TrackerOAuth aniList =
                (TrackerOAuth) sceneManager.getPluginManager().getTracker(AniList.ID);
        if (aniList.isSupported()) {
            authUrlFieldAniList.setText(aniList.fullAuthUrl());
        } else {
            anilistErrorBox.setVisible(true);
            anilistErrorBox.setManaged(true);
        }
        TrackerOAuth kitsu = (TrackerOAuth) sceneManager.getPluginManager().getTracker(Kitsu.ID);
        if (!kitsu.isSupported()) {
            kitsuErrorBox.setVisible(true);
            kitsuErrorBox.setManaged(true);
        }
    }

    /**
     * Update the page effect/filter preview using the slider values.
     * <p>
     * This method also updates the labels next to each slider.
     */
    @FXML
    private void updateEffectPreview() {
        ColorAdjust color_adjust = new ColorAdjust();
        double hue = filterHueSlider.getValue();
        double saturation = filterSaturationSlider.getValue();
        double brightness = filterBrightnessSlider.getValue();

        if (effectColorCheck.isSelected()) {
            filterHueSliderLabel.setText(String.format("%.2f", hue));
            color_adjust.setHue(hue);
            color_adjust.setSaturation(filterSaturationSlider.getValue());

            filterSaturationSliderLabel.setText(String.format("%.2f", saturation));
            color_adjust.setSaturation(saturation);
            color_adjust.setHue(filterHueSlider.getValue());
        }
        if (effectBrightnessCheck.isSelected()) {
            filterBrightnessSliderLabel.setText(String.format("%.2f", brightness));
            color_adjust.setBrightness(brightness);
        }

        effectPreview.setEffect(color_adjust);
    }

    /**
     * @see Controller#onMadeActive()
     */
    @Override
    public void onMadeActive() {
        listView.getSelectionModel().selectFirst();

        // update controls with current values
        Config config = sceneManager.getConfig();
        // @formatter:off
        nightModeCheck.setSelected(
                (boolean) config.getValue(Config.Field.NIGHT_MODE_ENABLED));
        nightModeReaderCheck.setSelected(
                (boolean) config.getValue(Config.Field.NIGHT_MODE_READER_ONLY));
        quickReloadCheck.setSelected(
                (boolean) config.getValue(Config.Field.QUICK_RELOAD_SERIES));
        languageFilterCheck.setSelected(
            (boolean) config.getValue(Config.Field.LANGUAGE_FILTER_ENABLED));
        languageFilterBox.getSelectionModel().select(
            Languages.get((String) config.getValue(Config.Field.LANGUAGE_FILTER_LANGUAGE)));
        effectNightModeOnlyCheck.setSelected(
                (boolean) config.getValue(Config.Field.PAGE_FILTER_NIGHT_MODE_ONLY));
        effectColorCheck.setSelected(
                (boolean) config.getValue(Config.Field.PAGE_FILTER_COLOR_ENABLED));
        effectBrightnessCheck.setSelected(
                (boolean) config.getValue(Config.Field.PAGE_FILTER_BRIGHTNESS_ENABLED));
        filterHueSlider.setValue(
                (double) config.getValue(Config.Field.PAGE_FILTER_COLOR_HUE));
        filterSaturationSlider.setValue(
                (double) config.getValue(Config.Field.PAGE_FILTER_COLOR_SATURATION));
        filterBrightnessSlider.setValue(
                (double) config.getValue(Config.Field.PAGE_FILTER_BRIGHTNESS));
        invertReadingCheckbox.setSelected(
                (boolean) config.getValue(Config.Field.INVERT_READING_STYLE));
        restrictPreloadingCheck.setSelected(
                (boolean) config.getValue(Config.Field.RESTRICT_PRELOAD_PAGES));
        preloadingAmountSpinner.getValueFactory().setValue(
                (int) Math.round((double) config.getValue(Config.Field.PRELOAD_PAGES_AMOUNT)));
        readerKeyPrevPage.setText(
                (String) config.getValue(Config.Field.READER_KEY_PREV_PAGE));
        readerKeyNextPage.setText(
                (String) config.getValue(Config.Field.READER_KEY_NEXT_PAGE));
        readerKeyFirstPage.setText(
                (String) config.getValue(Config.Field.READER_KEY_FIRST_PAGE));
        readerKeyLastPage.setText(
                (String) config.getValue(Config.Field.READER_KEY_LAST_PAGE));
        readerKeyToSeries.setText(
                (String) config.getValue(Config.Field.READER_KEY_TO_SERIES));
        updateAutoCheckAniList.setSelected(
            (boolean) config.getValue(Config.Field.TRACKER_ANILIST_UPDATE_AUTO));
        // @formatter:on

        // update tracker authentication statuses
        for (Tracker tracker : sceneManager.getPluginManager().getTrackers()) {
            try {
                tracker.verifyAuthenticated();
            } catch (NotImplementedException | IOException e) {
                e.printStackTrace();
            }

            if (tracker.isAuthenticated()) {
                try {
                    String text = String.format("You are authenticated as: %s",
                            tracker.authenticatedUserName());
                    updateTrackerStatus(tracker.getClass().getField("ID").getInt(null), true, text);
                } catch (NotImplementedException | NotAuthenticatedException | IOException
                        | NoSuchFieldException | IllegalAccessException e) {
                    e.printStackTrace();
                }
            }
        }

        // hide statusPlugins message in case it was visible since the config was opened
        statusPlugins.setVisible(false);
        statusPlugins.setManaged(false);

        this.reloadPlugins();
    }

    /**
     * @see Controller#onMadeInactive() ()
     */
    @Override
    public void onMadeInactive() {
        stage.hide();

        // reload the active page
        Parent root = sceneManager.getStage().getScene().getRoot();
        sceneManager.getController(root).reload();
    }

    /**
     * Update the displayed authentication status of the given tracker.
     *
     * @param id      the id of the tracker to update
     * @param success whether the previous operation was successful
     * @param text    the status message to display
     */
    public void updateTrackerStatus(int id, boolean success, String text) {
        // update when FX app thread is available
        Platform.runLater(() -> {
            Label label = null;
            if (id == AniList.ID) {
                label = statusAniList;
            } else if (id == Kitsu.ID) {
                label = statusKitsu;
            }

            if (label != null) {
                label.setText(text);
                label.setVisible(true);
                label.setManaged(true);
                label.getStyleClass().removeAll();
                label.getStyleClass().add(success ? "successText" : "failText");
            }
        });
    }

    /**
     * Update the content pane using the selected item in the list.
     */
    private void updateContent() {
        HBox selected_item = listView.getSelectionModel().getSelectedItem();
        Text selected_text = (Text) selected_item.getChildren().get(1);
        for (Node node : configContentContainer.getChildren()) {
            boolean matches_clicked = node.getUserData().toString().equals(selected_text.getText());
            node.setVisible(matches_clicked);
            node.setManaged(matches_clicked);
        }
    }

    /**
     * Apply changes to the config using page controls, then close the window.
     */
    @FXML
    private void confirm() {
        Config config = sceneManager.getConfig();
        // @formatter:off
        config.replaceValue(Config.Field.NIGHT_MODE_ENABLED,
                nightModeCheck.isSelected());
        config.replaceValue(Config.Field.NIGHT_MODE_READER_ONLY,
                nightModeReaderCheck.isSelected());
        config.replaceValue(Config.Field.QUICK_RELOAD_SERIES,
                quickReloadCheck.isSelected());
        config.replaceValue(Config.Field.INVERT_READING_STYLE,
                invertReadingCheckbox.isSelected());
        config.replaceValue(Config.Field.LANGUAGE_FILTER_ENABLED,
                languageFilterCheck.isSelected());
        config.replaceValue(Config.Field.LANGUAGE_FILTER_LANGUAGE,
                languageFilterBox.getSelectionModel().getSelectedItem().name());
        config.replaceValue(Config.Field.PAGE_FILTER_NIGHT_MODE_ONLY,
                effectNightModeOnlyCheck.isSelected());
        config.replaceValue(Config.Field.PAGE_FILTER_COLOR_ENABLED,
                effectColorCheck.isSelected());
        config.replaceValue(Config.Field.PAGE_FILTER_BRIGHTNESS_ENABLED,
                effectBrightnessCheck.isSelected());
        config.replaceValue(Config.Field.PAGE_FILTER_COLOR_HUE,
                filterHueSlider.getValue());
        config.replaceValue(Config.Field.PAGE_FILTER_COLOR_SATURATION,
                filterSaturationSlider.getValue());
        config.replaceValue(Config.Field.PAGE_FILTER_BRIGHTNESS,
                filterBrightnessSlider.getValue());
        config.replaceValue(Config.Field.RESTRICT_PRELOAD_PAGES,
                restrictPreloadingCheck.isSelected());
        config.replaceValue(Config.Field.PRELOAD_PAGES_AMOUNT,
                preloadingAmountSpinner.getValue());
        config.replaceValue(Config.Field.READER_KEY_PREV_PAGE,
                readerKeyPrevPage.getText());
        config.replaceValue(Config.Field.READER_KEY_NEXT_PAGE,
                readerKeyNextPage.getText());
        config.replaceValue(Config.Field.READER_KEY_FIRST_PAGE,
                readerKeyFirstPage.getText());
        config.replaceValue(Config.Field.READER_KEY_LAST_PAGE,
                readerKeyLastPage.getText());
        config.replaceValue(Config.Field.READER_KEY_TO_SERIES,
                readerKeyToSeries.getText());

        /* TODO: it's strange that the field in the tracker object is separate from the value we
         * store here. In the future, we will want the Config object to be the only store for these
         * values. However, doing so can pose questions of when saveConfig should be run. */
        TrackerOAuth anilist =
                (TrackerOAuth) sceneManager.getPluginManager().getTracker(AniList.ID);
        config.replaceValue(Config.Field.TRACKER_ANILIST_AUTHENTICATED,
                anilist.isAuthenticated());
        config.replaceValue(Config.Field.TRACKER_ANILIST_TOKEN,
                anilist.getToken() == null ? "" : anilist.getToken());
        config.replaceValue(Config.Field.TRACKER_ANILIST_UPDATE_AUTO,
                updateAutoCheckAniList.isSelected());
        // @formatter:on

        sceneManager.saveConfig();

        // ensure that night_mode_reader_only is properly applied
        toggleNightMode();
        toggleNightMode();

        onMadeInactive();
    }

    /**
     * Cancel making changes to the config (without saving anything).
     */
    @FXML
    private void cancel() {
        onMadeInactive();
    }

    /**
     * Prompt the user to restore the default config.
     */
    @FXML
    private void promptRestoreDefaults() {
        Alert alert = new Alert(Alert.AlertType.WARNING, "", ButtonType.YES, ButtonType.CANCEL);

        Label label = new Label("Are you sure you want to restore the default "
                + "configuration?\nThis will erase your current settings.");
        label.setWrapText(true);

        VBox alert_container = new VBox();
        alert_container.getChildren().add(label);

        alert.getDialogPane().setContent(alert_container);
        alert.setTitle(stage.getTitle());
        alert.showAndWait();

        if (alert.getResult() == ButtonType.YES) {
            sceneManager.getConfig().restoreDefaults();
            onMadeActive();
        }
    }

    @FXML
    private void promptKeyBinding(ActionEvent event) {
        Button caller_button = (Button) event.getSource();

        Alert alert = new Alert(Alert.AlertType.NONE, "Press the key to bind to this operation.",
                ButtonType.CANCEL);
        Button cancel_button = (Button) alert.getDialogPane().lookupButton(ButtonType.CANCEL);
        cancel_button.setOnKeyPressed(keyEvent -> {
            caller_button.setText(keyEvent.getCode().toString());
            alert.close();
        });

        alert.setTitle(stage.getTitle());
        alert.showAndWait();
    }

    @FXML
    private void promptUpdatePlugins() {
        PluginManager pluginManager = sceneManager.getPluginManager();

        Alert alert = new Alert(Alert.AlertType.NONE, "", ButtonType.OK, ButtonType.CANCEL);

        // create ui elements of alert container
        Label categories_label = new Label("Select plugins to install/update:");
        categories_label.getStyleClass().add("bareText");
        categories_label.setWrapText(true);

        // add content to alert container
        VBox alert_container = new VBox();
        alert_container.setSpacing(10);
        ScrollPane categories_scrollpane = new ScrollPane();
        categories_scrollpane.setMaxHeight(300);
        VBox categories_container = new VBox();
        categories_container.setSpacing(10);
        categories_container.getChildren().addAll(categories_label);
        categories_scrollpane.setContent(categories_container);
        alert_container.getChildren().addAll(categories_label, categories_scrollpane);

        // fetch list of plugins
        JsonArray json_plugins;
        try {
            json_plugins = pluginManager.downloadPluginIndex();
        } catch (IOException e) {
            promptError(
                    "An error occurred when downloading the list of plugins:\n\n" + e.getMessage());
            return;
        }

        // create list of checkboxes for the user to select which plugins to install
        ArrayList<CheckBox> plugin_boxes = new ArrayList<>();
        for (JsonElement json_plugin_ele : json_plugins) {
            JsonObject json_plugin = json_plugin_ele.getAsJsonObject();
            int id = json_plugin.get("id").getAsInt();
            String name = json_plugin.get("name").getAsString();
            String domain = json_plugin.get("domain").getAsString();
            int revision = json_plugin.get("revision").getAsInt();

            // don't add plugin to the list if it's already loaded and at the latest revision
            boolean should_display = true;
            ContentSource existing = pluginManager.getSource(id);
            if (existing != null) {
                try {
                    should_display =
                            existing.getClass().getField("REVISION").getInt(null) < revision;
                } catch (NoSuchFieldException | IllegalAccessException e) {
                    e.printStackTrace();
                }
            }

            if (should_display) {
                CheckBox checkbox =
                        new CheckBox(String.format("%s <%s> (rev=%d)", name, domain, revision));
                checkbox.setUserData(json_plugin);
                checkbox.selectedProperty().set(true);
                plugin_boxes.add(checkbox);
            }
        }

        categories_container.getChildren().addAll(plugin_boxes);
        alert.getDialogPane().setContent(alert_container);
        alert.setTitle(stage.getTitle());
        alert.showAndWait();

        if (alert.getResult() == ButtonType.OK) {
            // download all the selected plugins
            for (CheckBox checkbox : plugin_boxes) {
                if (checkbox.isSelected()) {
                    JsonObject json_plugin = (JsonObject) checkbox.getUserData();
                    String name = json_plugin.get("name").getAsString();
                    try {
                        pluginManager.downloadPlugin(name);
                    } catch (IOException e) {
                        promptError("An error occurred when downloading the \"" + name
                                + "\" plugin:\n\n" + e.getMessage());
                    }
                }
            }
        }

        this.reloadPlugins();
    }

    /**
     * Reset the page effect sliders/checks to their initial values.
     */
    @FXML
    private void resetPageEffects() {
        Config config = sceneManager.getConfig();
        // @formatter:off
        filterHueSlider.setValue(
                (double) config.getValue(Config.Field.PAGE_FILTER_COLOR_HUE));
        filterSaturationSlider.setValue(
                (double) config.getValue(Config.Field.PAGE_FILTER_COLOR_SATURATION));
        filterBrightnessSlider.setValue(
                (double) config.getValue(Config.Field.PAGE_FILTER_BRIGHTNESS));

        effectColorCheck.setSelected(
                (boolean) config.getValue(Config.Field.PAGE_FILTER_COLOR_ENABLED));
        effectBrightnessCheck.setSelected(
                (boolean) config.getValue(Config.Field.PAGE_FILTER_BRIGHTNESS_ENABLED));
        // @formatter:on
    }

    private void reloadPlugins() {
        PluginManager pluginManager = this.sceneManager.getPluginManager();
        pluginManager.reloadContentSources();

        // populate the contentSourcesList with plugins
        ObservableList<HBox> items = FXCollections.observableArrayList();
        for (ContentSource contentSource : pluginManager.getContentSources()) {
            // get properties of the plugin class
            String name_temp = "";
            int revision = -1;
            try {
                name_temp = contentSource.getClass().getField("NAME").get(null).toString();
                revision = contentSource.getClass().getField("REVISION").getInt(null);
            } catch (NoSuchFieldException | IllegalAccessException e) {
                e.printStackTrace();
            }
            final String name = name_temp; // hack since name needs to be final for button event

            // create list item
            HBox item_container = new HBox();
            item_container.getStyleClass().add("listItem");

            Label item_name = new Label(contentSource.toString());
            Label item_rev = new Label("v=" + String.valueOf(revision));
            item_rev.setPadding(new Insets(0, 10, 0, 0));

            Button btn_remove = new Button("Remove");
            btn_remove.setOnAction((event) -> {
                try {
                    pluginManager.deletePlugin(name);
                } catch (IOException e) {
                    promptError("An error occurred when deleting the \"" + name + "\" plugin:\n\n"
                            + e.getMessage());
                }
                statusPlugins.setText(
                        "Warning: plugins may not be completely removed until the client is restarted.");
                statusPlugins.setVisible(true);
                statusPlugins.setManaged(true);
                this.reloadPlugins();
            });

            HBox left_container = new HBox();
            HBox.setHgrow(left_container, Priority.ALWAYS);
            left_container.setAlignment(Pos.CENTER_LEFT);

            left_container.getChildren().addAll(item_name);
            item_container.getChildren().addAll(left_container, item_rev, btn_remove);
            items.add(item_container);
        }
        contentSourcesList.setItems(items);
    }

    /**
     * Generate the user's access token for the AniList tracker.
     *
     * @see AniList
     */
    @FXML
    private void anilistGenerateToken() {
        TrackerOAuth anilist =
                (TrackerOAuth) sceneManager.getPluginManager().getTracker(AniList.ID);
        String code = tokenFieldAniList.getText();
        sceneManager.getContentLoader().generateOAuthToken(anilist, code, this);
    }

    /**
     * Generate the user's access token for the Kitsu tracker.
     *
     * @see Kitsu
     */
    @FXML
    private void kitsuGenerateToken() {
        TrackerOAuth kitsu =
                (TrackerOAuth) sceneManager.getPluginManager().getTracker(Kitsu.ID);
        String username = usernameFieldKitsu.getText();
        String password = passwordFieldKitsu.getText();
        sceneManager.getContentLoader().generateOAuthToken(kitsu, username, password, this);
    }
}
