package com.pro.pass.controller;

import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pro.pass.dto.AccountDTO;
import com.pro.pass.dto.LoginRequestDTO;
import com.pro.pass.service.AccountService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

// Il logout è gestito da Spring Security su POST /auth/logout (vedi SecurityConfig).
@RestController
@RequestMapping ("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AccountService accountService;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    // ---------------------- LOGIN ----------------------

    @PostMapping ("/login")
    public AccountDTO login(@RequestBody LoginRequestDTO loginRequest, HttpServletRequest request,
            HttpServletResponse response) {
        AccountDTO account = accountService.autentica(loginRequest.getEmail(), loginRequest.getPassword());

        // Cambia l'id di una sessione già esistente: evita il "session fixation".
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }

        // Il "principal" è l'id dell'account: i controller lo ricevono con @AuthenticationPrincipal.
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(account.getId(), null, List.of()));
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        return account;
    }
}
