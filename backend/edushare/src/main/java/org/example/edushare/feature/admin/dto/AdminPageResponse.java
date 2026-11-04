package org.example.edushare.feature.admin.dto;

import java.util.List;
import org.springframework.data.domain.Page;

public record AdminPageResponse<T>(List<T> items, int page, int size, long totalElements) {
    public static <T> AdminPageResponse<T> from(Page<T> page) {
        return new AdminPageResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements());
    }
}
