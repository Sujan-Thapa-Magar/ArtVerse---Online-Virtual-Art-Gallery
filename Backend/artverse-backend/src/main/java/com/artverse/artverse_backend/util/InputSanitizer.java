package com.artverse.artverse_backend.util;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Strips HTML markup from user-supplied free text before it's persisted.
 *
 * The frontend is React, which escapes all rendered text by default, so
 * this is defense-in-depth rather than the primary XSS control — it exists
 * so stored data stays inert even if it's ever rendered somewhere other
 * than the current React app (an admin tool, an exported report, a future
 * API consumer). We strip tags rather than HTML-entity-encoding the text,
 * since encoding here would double-escape once React renders it — e.g.
 * "AT&T" would show up on screen as the literal text "AT&amp;T".
 */
public final class InputSanitizer {

    private static final Pattern HTML_TAG = Pattern.compile("<[^>]*>");

    private InputSanitizer() {}

    /** Removes any HTML-tag-shaped markup and trims. Null-safe. */
    public static String stripHtml(String input) {
        if (input == null) return null;
        return HTML_TAG.matcher(input).replaceAll("").trim();
    }

    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS =
            Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp");

    /**
     * Extracts a safe file extension from a client-supplied filename,
     * checked against an allow-list rather than trusted verbatim — an
     * attacker-controlled filename (e.g. containing "../" sequences, or an
     * executable extension) must never flow straight into a saved file path.
     * Falls back to ".jpg" for anything missing or not on the allow-list.
     */
    public static String safeImageExtension(String originalFilename) {
        if (originalFilename == null) return ".jpg";
        int dot = originalFilename.lastIndexOf('.');
        String ext = dot >= 0 ? originalFilename.substring(dot).toLowerCase() : "";
        return ALLOWED_IMAGE_EXTENSIONS.contains(ext) ? ext : ".jpg";
    }
}
