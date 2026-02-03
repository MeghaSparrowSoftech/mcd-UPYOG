package org.egov.user.web.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.imageio.ImageIO;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

import java.io.IOException;
import java.io.OutputStream;

import java.util.Random;


@RestController
@RequestMapping("/api")
public class CaptchaController {

	@GetMapping("/captcha")
    public void generateCaptcha(HttpServletRequest request,
                                HttpServletResponse response) throws IOException {

        // Generate random captcha text
        String captchaText = generateRandomText(6);

        // Store in session
        HttpSession session = request.getSession();
        session.setAttribute("CAPTCHA_VALUE", captchaText);
        session.setMaxInactiveInterval(120); // 2 minutes expiry

        // Create image
        BufferedImage image = createCaptchaImage(captchaText);

        response.setContentType("image/png");
        OutputStream out = response.getOutputStream();
        ImageIO.write(image, "png", out);
        out.close();
    }

    private String generateRandomText(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();

        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private BufferedImage createCaptchaImage(String text) {
        int width = 150;
        int height = 50;

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        g.setColor(Color.WHITE);
        g.fillRect(0, 0, width, height);

        g.setFont(new Font("Arial", Font.BOLD, 28));
        g.setColor(Color.BLACK);

        g.drawString(text, 20, 35);

        g.dispose();
        return image;
    }
}
