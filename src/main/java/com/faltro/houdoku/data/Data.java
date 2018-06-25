package com.faltro.houdoku.data;

import com.faltro.houdoku.model.Library;
import net.harawata.appdirs.AppDirs;
import net.harawata.appdirs.AppDirsFactory;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class Data {
    /**
     * AppDirs instance for determining cross-platform application directories.
     */
    private static AppDirs appDirs = AppDirsFactory.getInstance();
    /**
     * The base directory for storing application-specific user data.
     */
    private static String USER_DATA_DIR = appDirs.getUserDataDir("houdoku", null, "xgi");
    /**
     * The name of the file for storing library data.
     */
    private static Path PATH_LIBRARY = Paths.get(
            USER_DATA_DIR + File.separator + "library.json.gzip");

    /**
     * Saves the given Library to the filesystem.
     *
     * @param library the library to save
     * @see #loadLibrary()
     */
    public static void saveLibrary(Library library) {
        String serialized = Serializer.serializeLibrary(library);
        try {
            write(serialized, PATH_LIBRARY);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Loads a saved Library from the filesystem.
     *
     * @return the saved library, or null if it is not available
     * @see #saveLibrary(Library)
     */
    public static Library loadLibrary() {
        String data = null;
        if (Files.exists(PATH_LIBRARY)) {
            try {
                data = read(PATH_LIBRARY);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return data == null ? null : Serializer.deserializeLibrary(data);
    }

    /**
     * Writes the given string as binary data to the given file.
     * <p>
     * The data is compressed before being written.
     *
     * @param text the text to write
     * @param path the path of the file to write the data
     * @throws IOException an IOException occurred when writing to the file
     * @see Compressor#compress(String)
     * @see #read(Path)
     */
    private static void write(String text, Path path) throws IOException {
        // ensure path to file exists
        Files.createDirectories(path.getParent());
        // ensure file exists
        if (!Files.exists(path)) {
            Files.createFile(path);
        }
        Files.write(path, Compressor.compress(text));
    }

    /**
     * Reads the binary data of the given file to a String.
     * <p>
     * The data is decompressed before being returned.
     *
     * @param path the path of the file to read the data
     * @return a string representation of the
     * @throws IOException an IOException occurred when reading from the file
     * @see Compressor#decompress(byte[])
     * @see #write(String, Path)
     */
    private static String read(Path path) throws IOException {
        byte[] bytes = Files.readAllBytes(path);
        return Compressor.decompress(bytes);
    }
}
