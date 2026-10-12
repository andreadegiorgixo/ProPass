package com.pro.pass.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pro.pass.dto.PasswordDTO;
import com.pro.pass.service.PasswordService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// Ogni endpoint lavora solo sulle password dell'account in sessione: l'id dell'account
// arriva da @AuthenticationPrincipal, mai dall'URL o dal body.
@RestController
@RequestMapping ("/password")
@RequiredArgsConstructor
public class PasswordController {

    private final PasswordService passwordService;

    // ---------------------- CREATE (AGGIUNGI UNA PASSWORD) ----------------------

    @PostMapping
    public PasswordDTO createPassword(@AuthenticationPrincipal Long accountId, @RequestBody PasswordDTO passwordDTO) {
        return passwordService.savePassword(accountId, passwordDTO);
    }

    // ---------------------- GET (OTTENERE TUTTE LE MIE PASSWORD, ORDINATE PER NOME) ----------------------

    @GetMapping
    public List<PasswordDTO> getAllPasswords(@AuthenticationPrincipal Long accountId) {
        return passwordService.getAllPasswords(accountId);
    }

    // ---------------------- GET (OTTENERE UNA PASSWORD) ----------------------

    @GetMapping("/{id}")
    public PasswordDTO getPasswordById(@AuthenticationPrincipal Long accountId, @PathVariable Long id) {
        return passwordService.getPasswordById(accountId, id);
    }

    // ---------------------- DELETE (ELIMINA UNA PASSWORD) ----------------------

    @DeleteMapping ("/{id}")
    public void deletePasswordById(@AuthenticationPrincipal Long accountId, @PathVariable Long id) {
        passwordService.deletePasswordById(accountId, id);
    }

    // ---------------------- UPDATE (AGGIORNA UNA PASSWORD) ----------------------

    @PutMapping ("/{id}")
    public PasswordDTO updatePassword(@AuthenticationPrincipal Long accountId, @PathVariable Long id,
            @RequestBody PasswordDTO passwordDTO) {
        return passwordService.updatePassword(accountId, id, passwordDTO);
    }

    // ---------------------- GET (OTTENERE LE PASSWORD TRAMITE LINK) ----------------------

    // Il link è un parametro (?link=...) e non un pezzo di path: un URL contiene "/".
    @GetMapping("/linkPassword")
    public List<PasswordDTO> getPasswordByLink(@AuthenticationPrincipal Long accountId, @RequestParam String link) {
        return passwordService.getPasswordByLink(accountId, link);
    }

    // ---------------------- GET (OTTENERE LE PASSWORD TRAMITE USERNAME) ----------------------

    @GetMapping("/username")
    public List<PasswordDTO> getPasswordByUsername(@AuthenticationPrincipal Long accountId,
            @RequestParam String username) {
        return passwordService.getPasswordByUsername(accountId, username);
    }

    // ---------------------- GET (OTTENERE LE PASSWORD TRAMITE NOME PASSWORD) ----------------------

    @GetMapping("/nomePassword")
    public List<PasswordDTO> getPasswordByNomePassword(@AuthenticationPrincipal Long accountId,
            @RequestParam String nomePassword) {
        return passwordService.getPasswordByNomePassword(accountId, nomePassword);
    }
}
