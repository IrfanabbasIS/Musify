// package com.bd.musify.serviceImpl;


// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.mail.SimpleMailMessage;
// import org.springframework.mail.javamail.JavaMailSender;
// import org.springframework.stereotype.Service;

// import com.bd.musify.service.EmailService;

// @Service
// public class EmailServiceImpl  implements EmailService
// {

//     private static final Logger logger=LoggerFactory.getLogger(EmailService.class);
    
//     @Autowired
//     private JavaMailSender mailsender;

//    @Value("${app.frontend.url:http://localhost:4200}")
//     private String frontendUrl;

//     @Value("${spring.mail.username}")
//     private String fromEmail;
    
//     @Override
//     public void sendCredentials(String toEmail, String userName, String password) {
//         try{
//             SimpleMailMessage message=new SimpleMailMessage();
//             message.setFrom(fromEmail);
//             message.setTo(toEmail);
//             message.setSubject("Mucify - your Temporary Password");
//             String emailBody =
//                         "Hi " + userName + ",\n\n" +
//                         "We received a request to reset your password. Here is your temporary password:\n\n" +
//                         "Temporary Password: " + password + "\n\n" +
//                         "Please use this temporary password to log in to your account.\n\n" +
//                         "IMPORTANT: For security reasons, please change your password immediately after logging in.\n\n" +
//                         "You can log in at:" + frontendUrl + "/login\n\n" +
//                         "If you didn't request a password reset, please contact our support team immediately.\n\n" +
//                         "Best regards,\n" +
//                         "Musify Team";
//             message.setText(emailBody);
//             mailsender.send(message);
//             logger.info("Temporary password email sent to {}:", toEmail);

//         }
//         catch(Exception ex)
//         {
//             logger.error(("Failed to send temporary password email to {}: {}"),  toEmail, ex.getMessage(), ex);
//             throw new RuntimeException("Failed to send temporary password");
//         }
//     }

//     @Override
//     public void sendWelcomeEmail(String toEmail, String userName, String password) {
//         try{
//             SimpleMailMessage message=new SimpleMailMessage();
//             message.setFrom(fromEmail);
//             message.setTo(toEmail);
//             message.setSubject("Welcome to Muscify -Your account is Ready");
//            String emailBody =
//                         "Hi " + userName + ",\n\n"
//                     + "Welcome to Musify! Your account has been successfully created.\n\n"
//                     + "Here are your login credentials:\n"
//                     + "Email: " + toEmail + "\n"
//                     + "Temporary Password: " + password + "\n\n"
//                     + "You can log in at: " + frontendUrl + "/login\n\n"
//                     + "IMPORTANT: For security reasons, please change your password immediately after logging in.\n\n"
//                     + "Start exploring and enjoying your favorite music!\n\n"
//                     + "Best regards,\n"
//                     + "Musify Team";
//             message.setText(emailBody);
//             mailsender.send(message);
//             logger.info("Welcome email is send to {}", toEmail);

//         }
//         catch(Exception ex)
//         {
//             logger.error("Failed to sent welcome email t0{}:{}", toEmail, ex.getMessage(),ex);
//             throw new RuntimeException("Failed to send welcom email", ex);
//         }
//     }
    
// }





package com.bd.musify.serviceImpl;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.bd.musify.service.EmailService;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger =
            LoggerFactory.getLogger(EmailServiceImpl.class);

    private final RestClient restClient;

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    public EmailServiceImpl() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.brevo.com/v3")
                .build();
    }

    @Override
    public void sendCredentials(
            String toEmail,
            String userName,
            String password) {

        try {

            String emailBody =
                    "Hi " + userName + ",\n\n" +
                    "We received a request to reset your password.\n\n" +
                    "Temporary Password: " + password + "\n\n" +
                    "Please use this temporary password to log in.\n\n" +
                    "IMPORTANT: For security reasons, please change your password immediately after logging in.\n\n" +
                    "You can log in at: " + frontendUrl + "/login\n\n" +
                    "Best regards,\n" +
                    "Musify Team";

            sendEmail(
                    toEmail,
                    userName,
                    "Musify - Your Temporary Password",
                    emailBody
            );

            logger.info("Temporary password email sent to {}", toEmail);

        } catch (Exception ex) {

            logger.error(
                    "Failed to send temporary password email to {}: {}",
                    toEmail,
                    ex.getMessage(),
                    ex
            );

            throw new RuntimeException(
                    "Failed to send temporary password email",
                    ex
            );
        }
    }

    @Override
    public void sendWelcomeEmail(
            String toEmail,
            String userName,
            String password) {

        try {

            String emailBody =
                    "Hi " + userName + ",\n\n" +
                    "Welcome to Musify! Your account has been successfully created.\n\n" +
                    "Here are your login credentials:\n" +
                    "Email: " + toEmail + "\n" +
                    "Temporary Password: " + password + "\n\n" +
                    "You can log in at: " + frontendUrl + "/login\n\n" +
                    "IMPORTANT: For security reasons, please change your password immediately after logging in.\n\n" +
                    "Start exploring and enjoying your favorite music!\n\n" +
                    "Best regards,\n" +
                    "Musify Team";

            sendEmail(
                    toEmail,
                    userName,
                    "Welcome to Musify - Your Account is Ready",
                    emailBody
            );

            logger.info("Welcome email sent to {}", toEmail);

        } catch (Exception ex) {

            logger.error(
                    "Failed to send welcome email to {}: {}",
                    toEmail,
                    ex.getMessage(),
                    ex
            );

            throw new RuntimeException(
                    "Failed to send welcome email",
                    ex
            );
        }
    }

    private void sendEmail(
            String toEmail,
            String userName,
            String subject,
            String emailBody) {

        Map<String, Object> sender = new HashMap<>();
        sender.put("email", senderEmail);
        sender.put("name", "Musify");

        Map<String, Object> recipient = new HashMap<>();
        recipient.put("email", toEmail);
        recipient.put("name", userName);

        Map<String, Object> body = new HashMap<>();
        body.put("sender", sender);
        body.put("to", new Map[]{recipient});
        body.put("subject", subject);
        body.put("textContent", emailBody);

        restClient.post()
                .uri("/smtp/email")
                .header("api-key", brevoApiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }
}

