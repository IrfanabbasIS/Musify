package com.bd.musify.serviceImpl;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.bd.musify.service.EmailService;

@Service
public class EmailServiceImpl  implements EmailService
{

    private static final Logger logger=LoggerFactory.getLogger(EmailService.class);
    
    @Autowired
    private JavaMailSender mailsender;

   @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Override
    public void sendCredentials(String toEmail, String userName, String password) {
        try{
            SimpleMailMessage message=new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Mucify - your Temporary Password");
            String emailBody =
                        "Hi " + userName + ",\n\n" +
                        "We received a request to reset your password. Here is your temporary password:\n\n" +
                        "Temporary Password: " + password + "\n\n" +
                        "Please use this temporary password to log in to your account.\n\n" +
                        "IMPORTANT: For security reasons, please change your password immediately after logging in.\n\n" +
                        "You can log in at:" + frontendUrl + "/login\n\n" +
                        "If you didn't request a password reset, please contact our support team immediately.\n\n" +
                        "Best regards,\n" +
                        "Musify Team";
            message.setText(emailBody);
            mailsender.send(message);
            logger.info("Temporary password email sent to {}:", toEmail);

        }
        catch(Exception ex)
        {
            logger.error(("Failed to send temporary password email to {}: {}"),  toEmail, ex.getMessage(), ex);
            throw new RuntimeException("Failed to send temporary password");
        }
    }

    @Override
    public void sendWelcomeEmail(String toEmail, String userName, String password) {
        try{
            SimpleMailMessage message=new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to Muscify -Your account is Ready");
           String emailBody =
                        "Hi " + userName + ",\n\n"
                    + "Welcome to Musify! Your account has been successfully created.\n\n"
                    + "Here are your login credentials:\n"
                    + "Email: " + toEmail + "\n"
                    + "Temporary Password: " + password + "\n\n"
                    + "You can log in at: " + frontendUrl + "/login\n\n"
                    + "IMPORTANT: For security reasons, please change your password immediately after logging in.\n\n"
                    + "Start exploring and enjoying your favorite music!\n\n"
                    + "Best regards,\n"
                    + "Musify Team";
            message.setText(emailBody);
            mailsender.send(message);
            logger.info("Welcome email is send to {}", toEmail);

        }
        catch(Exception ex)
        {
            logger.error("Failed to sent welcome email t0{}:{}", toEmail, ex.getMessage(),ex);
            throw new RuntimeException("Failed to send welcom email");
        }
    }
    
}
