package com.bd.musify.serviceImpl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.bd.musify.service.GenericGeminiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.errors.ClientException;

@Service
public class GenericGeminiServiceImpl implements GenericGeminiService
{

    private static final Logger logger=LoggerFactory.getLogger(GenericGeminiServiceImpl.class);
    
    @Value("${spring.ai.google.genai.api-key}")
    private String geminiApiKey;

    @Value("${spring.ai.google.genai.chat.options.model}")
    private String geminiModels;

    
    private final ObjectMapper objectMapper;

    public GenericGeminiServiceImpl(ObjectMapper objectMapper)
    {
        this.objectMapper=objectMapper;
    }

    @Override
    public <T> T generateContent(String prompt, Class<T> responseType)
    {
        if(prompt==null || prompt.trim().isEmpty())
        {
            throw new IllegalArgumentException("Prompt cannot be null or empty");
        }
        Client client=new  Client.Builder().apiKey(geminiApiKey).build();
        String[] models=geminiModels.split(",");
        Exception lastException =null;
        for(int i=0; i<models.length; i++)
        {
            try{
                logger.info("Calling Gemini Api with model: {} ({}/{})", models[i].trim(),i+1, models.length);
                String response =client.models.generateContent(models[i].trim(), prompt, null).text();
                if(response==null || response.isEmpty())
                {
                    throw new RuntimeException("Empty response from gemini API");
                }

                return parseResponse(response, responseType);
            }
            catch(ClientException ex)
            {
                if(ex.getMessage()!=null && ex.getMessage().contains("429"))
                {
                    logger.warn("Rate limit exceeded for{}. Trying next models...", models[i].trim());
                    lastException=ex;
                    if(i<models.length-1) continue;
                }
                else{
                    throw new RuntimeException("Gemini Api error:" +ex.getMessage(), ex);
                }
            }
        }
        throw new RuntimeException("All Models exhausted due to rate limits", lastException);
    }

    private <T> T parseResponse(String response, Class<T> responseType) 
    {
        if(responseType == String.class)
        {
            return responseType.cast(response);
        }
        try{
            String json=response.trim();
            if(json.startsWith("```json")) json=json.substring(7);
            else if(json.startsWith("```")) json=json.substring(3);
            if(json.endsWith("```")) json =json.substring(0, json.length()-3);
            return objectMapper.readValue(json.trim(), responseType);
            
        }
        catch(Exception ex)
        {
            throw new RuntimeException("Failed to parse response:" +ex.getMessage(), ex);
        }
    }


}
