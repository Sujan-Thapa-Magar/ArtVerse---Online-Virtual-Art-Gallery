package com.artverse.artverse_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * eSewa ePay v2 helper — signs the payment request and verifies the
 * transaction against eSewa's status-check API.
 *
 * Flow docs: https://developer.esewa.com.np/pages/Epay
 */
@Service
public class EsewaService {

    @Value("${esewa.product-code}")
    private String productCode;

    @Value("${esewa.secret-key}")
    private String secretKey;

    @Value("${esewa.form-url}")
    private String formUrl;

    @Value("${esewa.status-url}")
    private String statusUrl;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newHttpClient();

    public String getProductCode() { return productCode; }
    public String getFormUrl() { return formUrl; }

    /** HMAC-SHA256 of the message with the merchant secret key, Base64 encoded. */
    public String sign(String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign eSewa payload", e);
        }
    }

    /**
     * Signature over the fields declared in signed_field_names, in order:
     * total_amount,transaction_uuid,product_code
     */
    public String signFormFields(String totalAmount, String transactionUuid) {
        String message = "total_amount=" + totalAmount
                + ",transaction_uuid=" + transactionUuid
                + ",product_code=" + productCode;
        return sign(message);
    }

    /**
     * Calls eSewa's transaction status API and returns true only when the
     * payment is COMPLETE. This is the authoritative server-side check —
     * we never trust the browser's success redirect alone.
     */
    public boolean isPaymentComplete(String totalAmount, String transactionUuid) {
        try {
            String url = statusUrl
                    + "?product_code=" + URLEncoder.encode(productCode, StandardCharsets.UTF_8)
                    + "&total_amount=" + URLEncoder.encode(totalAmount, StandardCharsets.UTF_8)
                    + "&transaction_uuid=" + URLEncoder.encode(transactionUuid, StandardCharsets.UTF_8);

            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) return false;

            JsonNode json = mapper.readTree(resp.body());
            return "COMPLETE".equalsIgnoreCase(json.path("status").asText());
        } catch (Exception e) {
            return false;
        }
    }
}
