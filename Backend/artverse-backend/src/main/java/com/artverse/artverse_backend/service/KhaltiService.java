package com.artverse.artverse_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Khalti ePayment (KPG-2) helper — initiates a hosted checkout session and
 * looks up its final status.
 *
 * Flow docs: https://docs.khalti.com/khalti-epayment/
 */
@Service
public class KhaltiService {

    @Value("${khalti.secret-key}")
    private String secretKey;

    @Value("${khalti.base-url}")
    private String baseUrl;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newHttpClient();

    /**
     * Calls /epayment/initiate/ and returns the parsed response
     * (fields: pidx, payment_url, expires_at, expires_in).
     */
    public JsonNode initiate(long amountPaisa, String purchaseOrderId, String purchaseOrderName,
                              String returnUrl, String websiteUrl) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("return_url", returnUrl);
        body.put("website_url", websiteUrl);
        body.put("amount", amountPaisa);
        body.put("purchase_order_id", purchaseOrderId);
        body.put("purchase_order_name", purchaseOrderName);

        HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + "epayment/initiate/"))
                .header("Authorization", "Key " + secretKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body), StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
        JsonNode json = mapper.readTree(resp.body());
        if (resp.statusCode() != 200) {
            String detail = json.has("detail") ? json.path("detail").asText() : resp.body();
            throw new RuntimeException("Khalti initiate failed: " + detail);
        }
        return json;
    }

    /**
     * Calls /epayment/lookup/ for the given pidx. Returns the raw response;
     * callers must check status == "Completed" before granting anything —
     * this is the authoritative server-side check, never trust the redirect alone.
     */
    public JsonNode lookup(String pidx) throws Exception {
        Map<String, Object> body = Map.of("pidx", pidx);

        HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + "epayment/lookup/"))
                .header("Authorization", "Key " + secretKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body), StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
        JsonNode json = mapper.readTree(resp.body());
        if (resp.statusCode() != 200) {
            String detail = json.has("detail") ? json.path("detail").asText() : resp.body();
            throw new RuntimeException("Khalti lookup failed: " + detail);
        }
        return json;
    }
}
