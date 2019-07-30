package com.faltro.houdoku.plugins.tracker;

import com.faltro.houdoku.Houdoku;
import com.faltro.houdoku.data.Serializer;
import com.faltro.houdoku.exception.NotAuthenticatedException;
import com.faltro.houdoku.model.Statuses;
import com.faltro.houdoku.model.Track;
import com.faltro.houdoku.model.Statuses.Status;
import com.faltro.houdoku.net.KitsuInterceptor;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import okhttp3.FormBody;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import static com.faltro.houdoku.net.Requests.GET;
import static com.faltro.houdoku.net.Requests.POST;

/**
 * This class contains implementation details for processing data from a specific "tracker" - a
 * website for users to track their reading.
 * <p>
 * For method and field documentation, please see the Tracker/TrackerOAuth classes. Additionally,
 * the implementation of some common methods is done in the GenericTrackerOAuth class.
 *
 * @see GenericTrackerOAuth
 * @see TrackerOAuth
 * @see Tracker
 */
public class Kitsu extends GenericTrackerOAuth {
    public static final int ID = 1;
    public static final String NAME = "Kitsu";
    public static final String DOMAIN = "kitsu.io";
    public static final String PROTOCOL = "https";
    public static final String TOKEN_URL = "/api/oauth/token";
    public static final String CLIENT_ID = Houdoku.getKitsuId();
    public static final String CLIENT_SECRET = Houdoku.getKitsuSecret();
    private final KitsuInterceptor interceptor = new KitsuInterceptor();
    private final OkHttpClient client =
            new OkHttpClient().newBuilder().addInterceptor(interceptor).build();

    public Kitsu() {
    }

    public Kitsu(String access_token) {
        this.authenticated = true;
        this.setAccessToken(access_token);
    }

    @Override
    public void generateToken(String username, String password) throws IOException {
        // TODO: store refresh_token from response and add support for using it when necessary 
        FormBody.Builder body = new FormBody.Builder();
        body.add("grant_type", "password");
        body.add("client_id", CLIENT_ID);
        body.add("client_secret", CLIENT_SECRET);
        body.add("username", username);
        body.add("password", password);
        Response response = POST(client, PROTOCOL + "://" + DOMAIN + TOKEN_URL, body.build());

        JsonObject json_data = new JsonParser().parse(response.body().string()).getAsJsonObject();
        JsonElement json_access_token = json_data.get("access_token");
        if (json_access_token != null) {
            this.setAccessToken(json_access_token.getAsString());
            this.authenticated = true;
        }
    }

    @Override
    public String authenticatedUserName() throws IOException, NotAuthenticatedException {
        return authenticatedUser().get("attributes").getAsJsonObject().get("name").getAsString();
    }

    /**
     * Retrieve a user object for the authenticated user.
     *
     * @return a JsonObject with the authenticated user's information
     * @throws IOException               an IOException occurred when retrieving
     * @throws NotAuthenticatedException the user is not authenticated
     */
    private JsonObject authenticatedUser() throws IOException, NotAuthenticatedException {
        HashMap<String, String> params = new HashMap<>();
        params.put("filter[self]", "true");
        Response response = GET(client, PROTOCOL + "://" + DOMAIN + "/api/edge/users", params);
        JsonObject json_response =
                new JsonParser().parse(response.body().string()).getAsJsonObject();

        JsonArray data = json_response.get("data").getAsJsonArray();
        return data.get(0).getAsJsonObject();
    }

    private void setAccessToken(String token) {
        this.access_token = token;
        interceptor.setToken(token);
    }
}
