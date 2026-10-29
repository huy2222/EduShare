package org.example.edushare.feature.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MajorOptionResponse {
    private String id;
    private String code;
    private String name;
    private List<SubjectOptionResponse> subjects;
}
