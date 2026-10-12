package com.pro.pass.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pro.pass.dto.AccountDTO;
import com.pro.pass.dto.AccountRequestDTO;
import com.pro.pass.service.AccountService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping ("/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    // ---------------------- CREATE (REGISTRAZIONE: UNICO ENDPOINT PUBBLICO) ----------------------

    @PostMapping
    public AccountDTO createAccount(@RequestBody AccountRequestDTO accountRequestDTO) {
        return accountService.createAccountDTO(accountRequestDTO);
    }

    // ---------------------- GET (IL MIO ACCOUNT: L'ID VIENE DALLA SESSIONE, NON DALL'URL) ----------------------

    @GetMapping ("/me")
    public AccountDTO getMyAccount(@AuthenticationPrincipal Long accountId) {
        return accountService.getAccountDTOById(accountId);
    }

    // ---------------------- UPDATE (MODIFICA IL MIO ACCOUNT) ----------------------

    @PutMapping ("/me")
    public AccountDTO updateMyAccount(@AuthenticationPrincipal Long accountId,
            @RequestBody AccountRequestDTO accountRequestDTO) {
        return accountService.updateAccountDTO(accountId, accountRequestDTO);
    }

    // ---------------------- DELETE (ELIMINA IL MIO ACCOUNT E CHIUDE LA SESSIONE) ----------------------

    @DeleteMapping ("/me")
    public void deleteMyAccount(@AuthenticationPrincipal Long accountId, Authentication authentication,
            HttpServletRequest request, HttpServletResponse response) {
        accountService.deleteAccountById(accountId);
        new SecurityContextLogoutHandler().logout(request, response, authentication);
    }

    // ---------------------- CHECK (VERIFICA SE UNA EMAIL È GIÀ IN USO, SOLO DA LOGGATI) ----------------------

    @GetMapping ("/check/{email}")
    public boolean accountExistsByEmail(@PathVariable String email) {
        return accountService.accountExistsByEmail(email);
    }
}
