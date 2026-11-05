package org.example.edushare.feature.admin.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.admin.dto.*;
import org.example.edushare.feature.admin.repository.AdminCatalogRepository;
import org.example.edushare.feature.academic.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCatalogQueryService {
    private final AdminCatalogRepository catalog;
    private final FacultyRepository faculties;
    private final MajorRepository majors;
    private final SubjectRepository subjects;

    @PreAuthorize("@adminAuthorization.catalog(#type, #options)")
    public AdminPageResponse<CatalogRowResponse> search(String type, String search, String facultyId,
            String majorId, int page, int size, boolean options) {
        validate(type);
        if (page < 0 || page > 1000000 || size < 1 || size > 50 || search.length() > 200)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tham số phân trang hoặc tìm kiếm không hợp lệ.");
        return AdminPageResponse.from(catalog.search(type, search, facultyId, majorId, PageRequest.of(page, size), options));
    }

    @PreAuthorize("@adminAuthorization.catalog(#type, false)")
    public CatalogDetailResponse detail(String type, String id) {
        validate(type);
        var missing = new ResponseStatusException(HttpStatus.NOT_FOUND, "Dữ liệu không tồn tại.");
        if (type.equals("faculties")) {
            var f = faculties.findById(id).orElseThrow(() -> missing);
            return new CatalogDetailResponse(f.getId(), f.getCode(), f.getName(), f.getDescription(), null, null, null, List.of());
        }
        if (type.equals("majors")) {
            var m = majors.findById(id).orElseThrow(() -> missing);
            return new CatalogDetailResponse(m.getId(), m.getCode(), m.getName(), m.getDescription(), m.getFaculty().getId(), m.getFaculty().getName(), null, List.of());
        }
        var s = subjects.findById(id).orElseThrow(() -> missing);
        // Preserve the managing faculty shown for legacy subjects until explicitly saved.
        var f = s.getFaculty();
        var selected = catalog.subjectMajors(id);
        String facultyId = f == null ? selected.stream().map(CatalogRowResponse::facultyId).findFirst().orElse(null) : f.getId();
        String facultyName = f == null ? selected.stream().map(CatalogRowResponse::facultyName).findFirst().orElse(null) : f.getName();
        return new CatalogDetailResponse(s.getId(), s.getCode(), s.getName(), s.getDescription(), facultyId, facultyName, s.getCredits(), selected);
    }

    private void validate(String type) {
        if (!List.of("faculties", "majors", "subjects").contains(type))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Danh mục không tồn tại.");
    }
}
