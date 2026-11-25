package org.example.edushare.feature.academic.controller;

import lombok.RequiredArgsConstructor;
import org.example.edushare.common.response.ApiResponse;
import org.example.edushare.feature.academic.service.LibraryBrowseService;
import org.example.edushare.feature.academic.service.LibraryBrowseService.*;
import org.example.edushare.feature.document.service.PublishedDocumentService.Results;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/library")
@RequiredArgsConstructor
public class LibrarySubjectController {
    private final LibraryBrowseService service;

    @GetMapping("/subjects")
    public ApiResponse<Results<SubjectSummary>> subjects(@RequestParam(defaultValue = "") String query,
            @RequestParam(required = false) String facultyId, @RequestParam(required = false) String majorId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "6") int size) {
        return response(service.subjects(query, facultyId, majorId, page, size, null));
    }

    @GetMapping("/subjects/{id}")
    public ApiResponse<SubjectDetail> subject(@PathVariable String id) { return response(service.subject(id)); }

    @GetMapping("/me/subjects")
    public ApiResponse<Results<SubjectSummary>> followedSubjects(@RequestParam(defaultValue = "") String query,
            @RequestParam(required = false) String facultyId, @RequestParam(required = false) String majorId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "6") int size, Principal user) {
        return response(service.subjects(query, facultyId, majorId, page, size, user.getName()));
    }

    @GetMapping("/me/subject-follows")
    public ApiResponse<List<String>> followedIds(Principal user) { return response(service.followedIds(user.getName())); }

    @PutMapping("/me/subjects/{id}/follow")
    public ApiResponse<FollowState> follow(@PathVariable String id, Principal user) {
        return response(service.follow(id, user.getName(), true));
    }

    @DeleteMapping("/me/subjects/{id}/follow")
    public ApiResponse<FollowState> unfollow(@PathVariable String id, Principal user) {
        return response(service.follow(id, user.getName(), false));
    }

    private <T> ApiResponse<T> response(T result) { return ApiResponse.<T>builder().result(result).build(); }
}
