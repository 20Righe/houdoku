package com.faltro.houdoku.plugins.tracker;

import com.faltro.houdoku.exception.NotAuthenticatedException;
import com.faltro.houdoku.exception.NotImplementedException;
import okhttp3.OkHttpClient;

import java.io.IOException;

/**
 * A tracker is a website for users to individually track their manga/comic
 * lists. These websites generally hold a database of series' with extensive
 * information for each. Users can create a 'list' of series' that they are
 * interested in, generally also being able to categorize them in various ways
 * (i.e. "Reading", "Planning", "Completed"). Users are also able to record the
 * number of chapters from each series that they have read.
 * <p>
 * For this client, we want users to link with a tracker and have their lists
 * be automatically updated. When they read a chapter in the client, their list
 * should be updated. One of the primary difficulties faced here is that
 * tracker websites often store series' under different names/titles. It is
 * unfortunately necessary that we create an interface for the user to manually
 * search each database in order to link it with a Series in their Library.
 *
 * @see com.faltro.houdoku.plugins.tracker
 */
public interface Tracker {
    /**
     * The unique identifier for the Tracker.
     */
    int ID = -1;
    /**
     * The user-friendly name of the Tracker.
     */
    String NAME = "UnimplementedTracker";
    /**
     * The domain of the Tracker.
     */
    String DOMAIN = "example.com";
    /**
     * The protocol for the Tracker, which is likely either http or https.
     */
    String PROTOCOL = "https";

    /**
     * @return whether or not the user is authenticated
     */
    boolean isAuthenticated();

    /**
     * Verify whether the client is actually authenticated with the server,
     * regardless of a cached `authenticated` property.
     * <p>
     * The {@link #isAuthenticated()} property is updated, if necessary.
     * <p>
     * This function is particularly useful to check whether any access token
     * is still valid after the client was restarted.
     *
     * @throws NotImplementedException the operation has not yet been
     *                                 implemented for this tracker
     * @throws IOException             an IOException occurred when checking
     */
    void verifyAuthenticated() throws NotImplementedException, IOException;

    /**
     * Retrieve the name of the authenticated user.
     * <p>
     * Requires {@link #isAuthenticated()}.
     *
     * @return the name of the authenticated user
     * @throws NotImplementedException   the operation has not yet been
     *                                   implemented for this tracker
     * @throws NotAuthenticatedException the user is not authenticated
     * @throws IOException               an IOException occurred when retrieving
     */
    String authenticatedUserName() throws NotImplementedException, NotAuthenticatedException,
            IOException;

    /**
     * Safely update the number of chapters read for a series.
     * <p>
     * If the user's number read is greater than the given value, the number on
     * the tracker is not changed.
     *
     * @param id  the series id
     * @param num the number of chapters read
     * @throws NotImplementedException   the operation has not yet been
     *                                   implemented for this tracker
     * @throws NotAuthenticatedException the user is not authenticated
     * @throws IOException               an IOException occurred when updating
     */
    void updateChaptersRead(String id, int num) throws NotImplementedException,
            NotAuthenticatedException, IOException;

    /**
     * Retrieve the client for making HTTP requests, which may be built with
     * applicable interceptors.
     *
     * @return an OkHttpClient for making requests to this Tracker
     */
    OkHttpClient getClient();

    /**
     * Represents this Tracker as a string.
     *
     * @return the user-friendly representation of this Tracker
     */
    String toString();
}
