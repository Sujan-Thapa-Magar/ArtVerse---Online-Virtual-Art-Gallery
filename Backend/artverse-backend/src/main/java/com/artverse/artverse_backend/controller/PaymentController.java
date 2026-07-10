package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.model.Artwork;
import com.artverse.artverse_backend.model.Order;
import com.artverse.artverse_backend.repository.ArtworkRepository;
import com.artverse.artverse_backend.service.EsewaService;
import com.artverse.artverse_backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * eSewa ePay v2 payment flow.
 *
 * 1. POST /initiate/{artworkId} — signs an eSewa form payload and returns the
 *    fields the browser must POST to eSewa. The artwork id is encoded into the
 *    transaction_uuid so we don't need a separate pending-payment table.
 * 2. POST /verify — after eSewa redirects the browser back, the frontend calls
 *    this with the transaction_uuid. We confirm the payment with eSewa's status
 *    API (authoritative) and only then create the order.
 */
@RestController
@RequestMapping("/api/payments/esewa")
public class PaymentController {

    @Autowired
    private EsewaService esewaService;

    @Autowired
    private ArtworkRepository artworkRepository;

    @Autowired
    private OrderService orderService;

    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    @PostMapping("/initiate/{artworkId}")
    public ResponseEntity<?> initiate(
            @PathVariable Long artworkId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Artwork artwork = artworkRepository.findById(artworkId)
                    .orElseThrow(() -> new RuntimeException("Artwork not found"));

            if (!artwork.isForSale()) {
                throw new RuntimeException("This artwork is no longer available for sale.");
            }
            if (artwork.getPrice() == null || artwork.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("This artwork does not have a valid price.");
            }

            String totalAmount = formatAmount(artwork.getPrice());
            String transactionUuid = "AV-" + artworkId + "-" + System.currentTimeMillis();
            String signature = esewaService.signFormFields(totalAmount, transactionUuid);

            // Order matters for how eSewa reads the auto-submitted form.
            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("amount", totalAmount);
            fields.put("tax_amount", "0");
            fields.put("total_amount", totalAmount);
            fields.put("transaction_uuid", transactionUuid);
            fields.put("product_code", esewaService.getProductCode());
            fields.put("product_service_charge", "0");
            fields.put("product_delivery_charge", "0");
            fields.put("success_url", frontendBaseUrl + "/payment/success");
            fields.put("failure_url", frontendBaseUrl + "/payment/failure");
            fields.put("signed_field_names", "total_amount,transaction_uuid,product_code");
            fields.put("signature", signature);

            Map<String, Object> res = new HashMap<>();
            res.put("esewaUrl", esewaService.getFormUrl());
            res.put("fields", fields);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String transactionUuid = body.get("transactionUuid");
            if (transactionUuid == null || transactionUuid.isBlank()) {
                throw new RuntimeException("Missing transaction reference.");
            }

            Long artworkId = parseArtworkId(transactionUuid);
            Artwork artwork = artworkRepository.findById(artworkId)
                    .orElseThrow(() -> new RuntimeException("Artwork not found"));

            // total_amount is recomputed from the authoritative artwork price,
            // never trusted from the client, so the amount can't be tampered with.
            String totalAmount = formatAmount(artwork.getPrice());

            boolean complete = esewaService.isPaymentComplete(totalAmount, transactionUuid);
            if (!complete) {
                throw new RuntimeException("Payment could not be verified with eSewa.");
            }

            Order order = orderService.buyNow(artworkId, userDetails.getUsername());
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** transaction_uuid format is AV-{artworkId}-{millis}. */
    private Long parseArtworkId(String transactionUuid) {
        try {
            String[] parts = transactionUuid.split("-");
            return Long.parseLong(parts[1]);
        } catch (Exception e) {
            throw new RuntimeException("Invalid transaction reference.");
        }
    }

    /** Whole-rupee string (e.g. "15000") — matches what we sign and send to eSewa. */
    private String formatAmount(BigDecimal price) {
        return price.stripTrailingZeros().toPlainString();
    }
}
