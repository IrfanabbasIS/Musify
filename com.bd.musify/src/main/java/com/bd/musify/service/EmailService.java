package com.bd.musify.service;

public interface EmailService {
    
    void sendCredentials(String toEmail, String userName, String password);
    

    void sendWelcomeEmail(String toEmail, String userName, String password);

}
