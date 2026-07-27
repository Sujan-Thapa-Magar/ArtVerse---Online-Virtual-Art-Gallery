package com.artverse.artverse_backend.controller;

import com.artverse.artverse_backend.dto.ArtworkUploadRequest;
import com.artverse.artverse_backend.model.Artwork;
import com.artverse.artverse_backend.service.ArtworkService;
import com.artverse.artverse_backend.util.InputSanitizer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/artworks")
@CrossOrigin(origins = "http://localhost:5173")
@Validated
public class ArtworkController {

    @Autowired
    private ArtworkService artworkService;


    @PostMapping("/upload")
    public ResponseEntity<?> uploadArtwork(
            @RequestParam("title") @NotBlank(message = "Title is required.") @Size(max = 200, message = "Title must be at most 200 characters.") String title,
            @RequestParam("description") @NotBlank(message = "Description is required.") @Size(max = 3000, message = "Description must be at most 3000 characters.") String description,
            @RequestParam(value = "medium", required = false) @Size(max = 100, message = "Medium must be at most 100 characters.") String medium,
            @RequestParam(value = "dimensions", required = false) @Size(max = 100, message = "Dimensions must be at most 100 characters.") String dimensions,
            @RequestParam(value = "price", required = false) Double price,
            @RequestParam(value = "isForSale", defaultValue = "false") boolean isForSale,
            @RequestParam(value = "category", required = false) @Size(max = 100, message = "Category must be at most 100 characters.") String category,
            @RequestParam("image") MultipartFile imageFile,
            Authentication authentication) {

        try {
            // Get the email of the logged-in user from the JWT token
            String artistEmail = authentication.getName();

            // Build the request object
            ArtworkUploadRequest request = new ArtworkUploadRequest();
            request.setTitle(InputSanitizer.stripHtml(title));
            request.setDescription(InputSanitizer.stripHtml(description));
            request.setMedium(InputSanitizer.stripHtml(medium));
            request.setDimensions(InputSanitizer.stripHtml(dimensions));
            request.setPrice(price);
            request.setForSale(isForSale);
            request.setCategory(InputSanitizer.stripHtml(category));

            // Call the service to save the artwork
            Artwork saved = artworkService.uploadArtwork(request, imageFile, artistEmail);

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }


    @GetMapping
    public ResponseEntity<List<Artwork>> getAllArtworks() {
        List<Artwork> artworks = artworkService.getAllArtworks();
        return ResponseEntity.ok(artworks);
    }


    @GetMapping("/{id}")
    public ResponseEntity<?> getArtworkById(@PathVariable Long id, Authentication authentication) {
        try {
            // Anonymous/guest viewers have no real authentication — Spring Security
            // gives them an "anonymousUser" principal rather than null, so we check
            // for both to get a real viewer email only when someone is actually logged in.
            String viewerEmail = (authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getName()))
                    ? authentication.getName() : null;
            Artwork artwork = artworkService.getArtworkById(id, viewerEmail);
            return ResponseEntity.ok(artwork);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }


    @GetMapping("/artist/{artistId}")
    public ResponseEntity<List<Artwork>> getArtworksByArtist(@PathVariable Long artistId) {
        List<Artwork> artworks = artworkService.getArtworksByArtist(artistId);
        return ResponseEntity.ok(artworks);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteArtwork(@PathVariable Long id, Authentication authentication) {
        try {
            String artistEmail = authentication.getName();
            artworkService.deleteArtwork(id, artistEmail);
            return ResponseEntity.ok("Artwork deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateArtwork(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) @Size(max = 200, message = "Title must be at most 200 characters.") String title,
            @RequestParam(value = "description", required = false) @Size(max = 3000, message = "Description must be at most 3000 characters.") String description,
            @RequestParam(value = "medium", required = false) @Size(max = 100, message = "Medium must be at most 100 characters.") String medium,
            @RequestParam(value = "dimensions", required = false) @Size(max = 100, message = "Dimensions must be at most 100 characters.") String dimensions,
            @RequestParam(value = "price", required = false) Double price,
            @RequestParam(value = "isForSale", defaultValue = "false") boolean isForSale,
            @RequestParam(value = "category", required = false) @Size(max = 100, message = "Category must be at most 100 characters.") String category,
            Authentication authentication) {
        try {
            String artistEmail = authentication.getName();
            ArtworkUploadRequest request = new ArtworkUploadRequest();
            request.setTitle(InputSanitizer.stripHtml(title));
            request.setDescription(InputSanitizer.stripHtml(description));
            request.setMedium(InputSanitizer.stripHtml(medium));
            request.setDimensions(InputSanitizer.stripHtml(dimensions));
            request.setPrice(price);
            request.setForSale(isForSale);
            request.setCategory(InputSanitizer.stripHtml(category));
            Artwork updated = artworkService.updateArtwork(id, artistEmail, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}