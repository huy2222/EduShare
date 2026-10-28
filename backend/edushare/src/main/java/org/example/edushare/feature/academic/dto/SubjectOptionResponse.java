package org.example.edushare.feature.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectOptionResponse {
    private String id;
    private String code;
    private String name;
    private Integer credits;
}
