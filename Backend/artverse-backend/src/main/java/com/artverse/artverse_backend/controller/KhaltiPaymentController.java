package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.dto.KhaltiVerifyRequest;
import com.artverse.artverse_backend.model.Artwork;
import com.artverse.artverse_backend.model.Order;
import com.artverse.artverse_backend.repository.ArtworkRepository;
import com.artverse.artverse_backend.service.KhaltiService;
import com.artverse.artverse_backend.service.OrderService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/**
 * Khalti ePayment (KPG-2) payment flow.
 *
 * 1. POST /initiate/{artworkId} — asks Khalti for a hosted checkout session
 *    and returns its payment_url. The artwork id is encoded into
 *    purchase_order_id so we don't need a separate pending-payment table.
 * 2. POST /verify — after Khalti redirects the browser back to our callback
 *    page, the frontend calls this with the pidx. We confirm the payment via
 *    Khalti's lookup API (authoritative) and only then create the order.
 */
@RestController
@RequestMapping("/api/payments/khalti")
public class KhaltiPaymentController {

    @Autowired
    private KhaltiService khaltiService;

    @Autowired
    private ArtworkRepository artworkRepository;

    @Autowired
    private OrderService orderService;

    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    // Khalti's minimum payable amount is Rs. 10 (1000 paisa).
    private static final long MIN_AMOUNT_PAISA = 1000;

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

            long amountPaisa = toPaisa(artwork.getPrice());
            if (amountPaisa < MIN_AMOUNT_PAISA) {
                throw new RuntimeException("Khalti requires a minimum amount of NPR 10.");
            }

            String purchaseOrderId = "AV-" + artworkId + "-" + System.currentTimeMillis();
            String returnUrl = frontendBaseUrl + "/payment/khalti/callback";

            JsonNode result = khaltiService.initiate(
                    amountPaisa, purchaseOrderId, artwork.getTitle(), returnUrl, frontendBaseUrl);

            Map<String, Object> res = new HashMap<>();
            res.put("paymentUrl", result.path("payment_url").asText());
            res.put("pidx", result.path("pidx").asText());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(
            @Valid @RequestBody KhaltiVerifyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String pidx = request.getPidx();
            String purchaseOrderId = request.getPurchaseOrderId();
            Long artworkId = parseArtworkId(purchaseOrderId);
            Artwork artwork = artworkRepository.findById(artworkId)
                    .orElseThrow(() -> new RuntimeException("Artwork not found"));

            JsonNode lookup = khaltiService.lookup(pidx);

            // Only "Completed" is a successful payment — everything else
            // (Pending, Expired, User canceled, Refunded) must be rejected.
            if (!"Completed".equalsIgnoreCase(lookup.path("status").asText())) {
                throw new RuntimeException("Payment was not completed with Khalti.");
            }

            // Cross-check the amount Khalti actually confirms was paid against
            // the artwork's real price, so a spoofed purchaseOrderId can't be
            // used to buy a differently-priced artwork with a stale pidx.
            long paidPaisa = lookup.path("total_amount").asLong();
            long expectedPaisa = toPaisa(artwork.getPrice());
            if (paidPaisa != expectedPaisa) {
                throw new RuntimeException("Paid amount does not match this artwork's price.");
            }

            Order order = orderService.buyNow(artworkId, userDetails.getUsername());
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** purchase_order_id format is AV-{artworkId}-{millis}. */
    private Long parseArtworkId(String purchaseOrderId) {
        try {
            String[] parts = purchaseOrderId.split("-");
            return Long.parseLong(parts[1]);
        } catch (Exception e) {
            throw new RuntimeException("Invalid purchase order reference.");
        }
    }

    /** NPR price -> integer paisa, as Khalti's amount field requires. */
    private long toPaisa(BigDecimal price) {
        return price.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }
}
