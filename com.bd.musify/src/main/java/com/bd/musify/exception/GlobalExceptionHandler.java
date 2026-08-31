package com.bd.musify.exception;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.catalina.connector.ClientAbortException;
import org.springframework.http.*;
import org.springframework.messaging.handler.annotation.support.MethodArgumentNotValidException;
import org.springframework.validation.FieldError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.bd.musify.dto.response.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;


@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger=LoggerFactory.getLogger(GlobalExceptionHandler.class);
    @ExceptionHandler({ClientAbortException.class , AsyncRequestNotUsableException.class})
    public void handleClientAbortException(Exception ex, WebRequest request)
    {
        logger.debug("Clinet disconnect to during file streaming:{},", ex.getMessage());
    }
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handlEmailAlreadyExistsException(EmailAlreadyExistsException ex, WebRequest request)
    {
        return buildErrorResponse(ex,HttpStatus.CONFLICT,request);
    }

    @ExceptionHandler({InvalidCredentialsException.class, InvalidTokenException.class, TokenExpiredException.class})
    public ResponseEntity<ErrorResponse> handleUnauthorizedException(RuntimeException ex, WebRequest request)
    {
        return buildErrorResponse(ex, HttpStatus.UNAUTHORIZED, request);
    }


    @ExceptionHandler({ResourceNotFoundException.class})
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex, WebRequest request)
    {
        return buildErrorResponse(ex, HttpStatus.NOT_FOUND, request);
    }

     @ExceptionHandler({MethodArgumentNotValidException.class})
    public ResponseEntity<ErrorResponse> handleValidtionException(MethodArgumentNotValidException ex, WebRequest request)
    {
        List<String> errors= ex.getBindingResult().getAllErrors().stream()
        .map(error -> ((FieldError)error).getField() + ":" + error.getDefaultMessage())
        .collect(Collectors.toList());
        ErrorResponse  errorResponse =new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            "Validation failed",
            getPath(request),
                errors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }


    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex, WebRequest request)
    {
        logger.error("Runtime exception ;{]", ex.getMessage(), ex);
        return buildErrorResponse(ex, HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex, WebRequest request)
    {
        logger.error("Unexpected Exception Occur; {}", ex.getMessage(), ex);
        return buildErrorResponse(ex, HttpStatus.INTERNAL_SERVER_ERROR, request);
    }




    private ResponseEntity<ErrorResponse> buildErrorResponse(Exception ex, HttpStatus status,WebRequest request) {
    ErrorResponse errorResponse=new ErrorResponse(
        LocalDateTime.now(),
        status.value(),
        status.getReasonPhrase(),
        ex.getMessage(),
        getPath(request)
    );
    return ResponseEntity.status(status).body(errorResponse);  
     
  }
    private String getPath(WebRequest request) {
        return request.getDescription(false).replace("uri=", "");
    }
}
