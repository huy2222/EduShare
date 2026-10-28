package org.example.edushare.feature.document.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.edushare.feature.document.entity.DocumentType;
import org.example.edushare.feature.document.entity.Semester;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentCreateRequest {

    @NotBlank(message = "Document title is required")
    @Size(max = 200, message = "Document title must not exceed 200 characters")
    private String title;

    @Size(max = 2000, message = "Document description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Document type is required")
    private DocumentType documentType;

    private Semester semester;

    @Pattern(regexp = "^\\d{4}-\\d{4}$", message = "Academic year must have format YYYY-YYYY")
    private String academicYear;

    @NotBlank(message = "Faculty is required")
    private String facultyId;

    @NotBlank(message = "Major is required")
    private String majorId;

    @NotBlank(message = "Subject is required")
    private String subjectId;
}
