package org.example.edushare.feature.document.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DocumentModerationStatsResponse {
    long pending;
    long approved;
    long rejected;
    long approvedToday;
    long rejectedToday;
    long total;
}
