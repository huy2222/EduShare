package org.example.edushare.feature.document.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.edushare.feature.document.entity.ModerationAction;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentModerationRequest {

    @NotNull(message = "Moderation action is required")
    private ModerationAction action;

    @Size(max = 1000, message = "Moderation reason must not exceed 1000 characters")
    private String reason;
}
