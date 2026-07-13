package com.artverse.artverse_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

/**
 * Verifies "Sign in with Google" ID tokens via Google's tokeninfo endpoint,
 * so a client can never forge a login by sending a hand-crafted payload —
 * the token itself is checked against Google's servers on every call.
 *
 * Docs: https://developers.google.com/identity/sign-in/web/backend-auth
 */
@Service
public class GoogleAuthService {

    @Value("${google.client-id}")
    private String clientId;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newHttpClient();

    public record GoogleUser(String email, String name) {}

    public GoogleUser verify(String idToken) {
        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token="
                    + URLEncoder.encode(idToken, StandardCharsets.UTF_8);

            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                throw new RuntimeException("Invalid or expired Google sign-in token.");
            }

            JsonNode json = mapper.readTree(resp.body());

            // The token must have been issued for THIS app's client ID —
            // otherwise a token meant for a different Google app could be replayed here.
            if (!clientId.equals(json.path("aud").asText())) {
                throw new RuntimeException("Google token was not issued for this application.");
            }
            if (!"true".equals(json.path("email_verified").asText())) {
                throw new RuntimeException("Google account email is not verified.");
            }

            String email = json.path("email").asText(null);
            if (email == null || email.isBlank()) {
                throw new RuntimeException("Google did not return an email address.");
            }
            String name = json.path("name").asText(email);

            return new GoogleUser(email, name);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Could not verify Google sign-in.", e);
        }
    }
}
