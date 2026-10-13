package com.pro.pass.service;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// Cifratura reversibile (AES-256-GCM) delle password salvate: a differenza dell'hash di
// PasswordEncoder, permette di rivedere la password in chiaro. La chiave sta nel .env.
@Service
public class CifraturaService {

    private static final String ALGORITMO = "AES/GCM/NoPadding";
    private static final int IV_BYTES = 12;     // dimensione standard dell'IV per GCM
    private static final int TAG_BITS = 128;    // lunghezza del tag di autenticazione

    private final SecretKeySpec chiave;
    private final SecureRandom random = new SecureRandom();

    // La chiave arriva da application.properties (app.encryption.key = APP_ENCRYPTION_KEY del .env)
    public CifraturaService(@Value("${app.encryption.key}") String chiaveBase64) {
        byte[] bytes = Base64.getDecoder().decode(chiaveBase64);
        if (bytes.length != 32) {
            throw new IllegalStateException("APP_ENCRYPTION_KEY deve essere di 32 byte (AES-256)");
        }
        this.chiave = new SecretKeySpec(bytes, "AES");
    }

    // ---------------------- CIFRA ----------------------

    public String cifra(String testoInChiaro) {
        try {
            // IV nuovo e casuale a ogni cifratura: mai riutilizzarlo con la stessa chiave
            byte[] iv = new byte[IV_BYTES];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITMO);
            cipher.init(Cipher.ENCRYPT_MODE, chiave, new GCMParameterSpec(TAG_BITS, iv));
            byte[] cifrato = cipher.doFinal(testoInChiaro.getBytes(StandardCharsets.UTF_8));

            // Si salva IV + testo cifrato insieme: l'IV non e' segreto, serve per decifrare
            byte[] risultato = new byte[IV_BYTES + cifrato.length];
            System.arraycopy(iv, 0, risultato, 0, IV_BYTES);
            System.arraycopy(cifrato, 0, risultato, IV_BYTES, cifrato.length);
            return Base64.getEncoder().encodeToString(risultato);
        } catch (GeneralSecurityException e) {
            // Messaggio generico: nei log non devono finire password o chiavi
            throw new IllegalStateException("Errore nella cifratura", e);
        }
    }

    // ---------------------- DECIFRA ----------------------

    public String decifra(String testoCifrato) {
        try {
            byte[] dati = Base64.getDecoder().decode(testoCifrato);

            Cipher cipher = Cipher.getInstance(ALGORITMO);
            // I primi 12 byte sono l'IV, il resto e' il testo cifrato (con il tag in coda)
            cipher.init(Cipher.DECRYPT_MODE, chiave, new GCMParameterSpec(TAG_BITS, dati, 0, IV_BYTES));
            byte[] chiaro = cipher.doFinal(dati, IV_BYTES, dati.length - IV_BYTES);
            return new String(chiaro, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            // IllegalArgumentException: valore non Base64 (es. vecchie righe $argon2id$...)
            throw new IllegalStateException("Errore nella decifratura", e);
        }
    }
}
