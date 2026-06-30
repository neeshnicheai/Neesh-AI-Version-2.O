package com.neeshai.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.validation.FieldError;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Value("${app.debug:false}")
    private boolean debugMode;

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex, WebRequest request) {
        // Generate correlation ID for tracking
        String correlationId = UUID.randomUUID().toString();

        // Log the full error details server-side
        log.error("Error [{}]: {} at {}", correlationId, ex.getMessage(), request.getDescription(false), ex);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("correlationId", correlationId);
        body.put("error", "Internal Server Error");

        // Only include detailed error info in debug mode
        if (debugMode) {
            body.put("message", ex.getMessage());
            body.put("exception", ex.getClass().getSimpleName());
        } else {
            body.put("message", "An unexpected error occurred. Please contact support with the correlation ID.");
        }

        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String correlationId = UUID.randomUUID().toString();

        // Log validation errors server-side
        log.warn("Validation error [{}]: {}", correlationId, ex.getMessage());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("correlationId", correlationId);
        body.put("error", "Validation Failed");

        // Collect all field errors
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());

        body.put("details", errors);

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
}
