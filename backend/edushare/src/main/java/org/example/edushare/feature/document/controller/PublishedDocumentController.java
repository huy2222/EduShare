package org.example.edushare.feature.document.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.example.edushare.common.response.ApiResponse;
import org.example.edushare.feature.document.dto.response.PublishedDocumentResponse;
import org.example.edushare.feature.document.service.PublishedDocumentService;
import org.example.edushare.feature.document.service.PublishedDocumentService.*;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/library")
@RequiredArgsConstructor
public class PublishedDocumentController {
    private final PublishedDocumentService service;

    public record CommentRequest(@NotBlank(message = "Hãy nhập bình luận.")
                                 @Size(max = 2000, message = "Bình luận tối đa 2.000 ký tự.") String body,
                                 UUID parentId) {}
    public record RatingRequest(
            @NotNull(message = "Hãy chọn số sao.")
            @Min(value = 0, message = "Số sao phải từ 0 đến 5.")
            @Max(value = 5, message = "Số sao phải từ 0 đến 5.")
            @Digits(integer = 1, fraction = 0, message = "Số sao phải là số nguyên từ 0 đến 5.")
            BigDecimal stars) {}

    @GetMapping("/documents")
    public ApiResponse<Results<PublishedDocumentResponse>> list(
            @RequestParam(defaultValue = "") String query, @RequestParam(defaultValue = "0") int page) {
        return response(service.list(query, page));
    }

    @GetMapping("/documents/{id}")
    public ApiResponse<Detail> detail(@PathVariable UUID id) {
        return response(service.detail(id));
    }

    @GetMapping("/documents/{id}/preview")
    public ResponseEntity<byte[]> preview(@PathVariable UUID id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .contentType(MediaType.APPLICATION_PDF).body(service.preview(id));
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable UUID id) {
        FileContent file = service.download(id);
        String disposition = ContentDisposition.attachment()
                .filename(file.name(), StandardCharsets.UTF_8).build().toString();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .contentType(MediaType.APPLICATION_OCTET_STREAM).body(file.bytes());
    }

    @GetMapping("/documents/{id}/comments")
    public ApiResponse<Results<Comment>> comments(@PathVariable UUID id, @RequestParam(required = false) UUID parentId,
                                                  @RequestParam(defaultValue = "0") int page) {
        return response(service.comments(id, parentId, page, null));
    }

    @GetMapping("/me/documents/{id}/comments")
    public ApiResponse<Results<Comment>> viewerComments(@PathVariable UUID id, Principal user,
                                                        @RequestParam(required = false) UUID parentId,
                                                        @RequestParam(defaultValue = "0") int page) {
        return response(service.comments(id, parentId, page, user.getName()));
    }

    @GetMapping("/me/favorites")
    public ApiResponse<Results<PublishedDocumentResponse>> favorites(
            Principal user, @RequestParam(defaultValue = "") String query, @RequestParam(defaultValue = "0") int page) {
        return response(service.favorites(user.getName(), query, page));
    }

    @GetMapping("/me/documents/{id}")
    public ApiResponse<Viewer> viewer(@PathVariable UUID id, Principal user) {
        return response(service.viewer(id, user.getName()));
    }

    @PostMapping("/me/documents/{id}/comments")
    public ApiResponse<Comment> addComment(@PathVariable UUID id, Principal user,
                                           @Valid @RequestBody CommentRequest request) {
        return response(service.addComment(id, user.getName(), request.body(), request.parentId()));
    }

    @PutMapping("/me/documents/{id}/comments/{commentId}/like")
    public ApiResponse<LikeState> likeComment(@PathVariable UUID id, @PathVariable UUID commentId, Principal user) {
        return response(service.likeComment(id, commentId, user.getName(), true));
    }

    @DeleteMapping("/me/documents/{id}/comments/{commentId}/like")
    public ApiResponse<LikeState> unlikeComment(@PathVariable UUID id, @PathVariable UUID commentId, Principal user) {
        return response(service.likeComment(id, commentId, user.getName(), false));
    }

    @PutMapping("/me/documents/{id}/rating")
    public ApiResponse<RatingSummary> rate(@PathVariable UUID id, Principal user,
                                           @Valid @RequestBody RatingRequest request) {
        return response(service.rate(id, user.getName(), request.stars().intValueExact()));
    }

    @PutMapping("/me/documents/{id}/favorite")
    public ApiResponse<Void> favorite(@PathVariable UUID id, Principal user) {
        service.favorite(id, user.getName(), true);
        return response(null);
    }

    @DeleteMapping("/me/documents/{id}/favorite")
    public ApiResponse<Void> unfavorite(@PathVariable UUID id, Principal user) {
        service.favorite(id, user.getName(), false);
        return response(null);
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, HttpMessageNotReadableException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> invalidInput() {
        return ApiResponse.<Void>builder().message("Dữ liệu yêu cầu không hợp lệ.").build();
    }

    private <T> ApiResponse<T> response(T result) {
        return ApiResponse.<T>builder().result(result).build();
    }
}
